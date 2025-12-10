import { and, eq } from "@ogm/db";
import { communities, members, user } from "@ogm/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure } from "../trpc";

/**
 * GHL Integration Router
 *
 * Handles GoHighLevel OAuth, webhooks, and contact syncing.
 * Note: Actual webhook handling should be done in a dedicated API route
 * that validates the webhook signature before calling these procedures.
 */
export const ghlRouter = {
  /**
   * Exchange OAuth code for tokens (called from OAuth callback)
   */
  exchangeCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        locationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement actual GHL OAuth token exchange
      // Exchange the authorization code for tokens
      const clientId = process.env.GHL_CLIENT_ID;
      const clientSecret = process.env.GHL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GHL credentials not configured",
        });
      }

      const tokenResponse = await fetch(
        "https://services.leadconnectorhq.com/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: input.code,
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[GHL OAuth] Token exchange failed:", errorText);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange code for tokens",
        });
      }

      const tokens = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };

      // Find community by location ID
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found for this GHL location",
        });
      }

      // Update community with tokens
      await ctx.db
        .update(communities)
        .set({
          ghlAccessToken: tokens.access_token,
          ghlRefreshToken: tokens.refresh_token,
          ghlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        })
        .where(eq(communities.id, community.id));

      return { success: true, communityId: community.id };
    }),

  /**
   * Sync a contact from GHL (creates or updates user and member)
   */
  syncContact: publicProcedure
    .input(
      z.object({
        locationId: z.string(),
        contactId: z.string(),
        email: z.email(),
        name: z.string(),
        tags: z.array(z.string()).default([]),
        // GHL Global User ID (if available from SSO)
        ghlUserId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find community by location ID
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found for this GHL location",
        });
      }

      // Check if user exists by email or GHL user ID
      let existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, input.email),
      });

      if (!existingUser && input.ghlUserId) {
        existingUser = await ctx.db.query.user.findFirst({
          where: eq(user.ghlGlobalUserId, input.ghlUserId),
        });
      }

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;

        // Update GHL user ID if not set
        if (!existingUser.ghlGlobalUserId && input.ghlUserId) {
          await ctx.db
            .update(user)
            .set({ ghlGlobalUserId: input.ghlUserId })
            .where(eq(user.id, userId));
        }
      } else {
        // Create new user
        // Note: In production, you'd use Better Auth's createUser
        // For now, we create directly in the database
        const [newUser] = await ctx.db
          .insert(user)
          .values({
            id: crypto.randomUUID(),
            email: input.email,
            name: input.name,
            emailVerified: true, // Verified via GHL
            ghlGlobalUserId: input.ghlUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (!newUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        userId = newUser.id;
      }

      // Check if member exists
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, userId),
          eq(members.communityId, community.id),
        ),
      });

      if (member) {
        // Update member with new contact info and tags
        const [updated] = await ctx.db
          .update(members)
          .set({
            ghlContactId: input.contactId,
            ghlTags: input.tags,
          })
          .where(eq(members.id, member.id))
          .returning();

        return { user: existingUser, member: updated, created: false };
      }
      // Create new member
      const [newMember] = await ctx.db
        .insert(members)
        .values({
          userId,
          communityId: community.id,
          ghlContactId: input.contactId,
          ghlTags: input.tags,
          role: "member",
        })
        .returning();

      return { userId, member: newMember, created: true };
    }),

  /**
   * Handle tag update webhook from GHL
   */
  updateTags: publicProcedure
    .input(
      z.object({
        locationId: z.string(),
        contactId: z.string(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find community
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found",
        });
      }

      // Find member by GHL contact ID
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.communityId, community.id),
          eq(members.ghlContactId, input.contactId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found for this contact",
        });
      }

      // Update tags
      const [updated] = await ctx.db
        .update(members)
        .set({ ghlTags: input.tags })
        .where(eq(members.id, member.id))
        .returning();

      return updated;
    }),

  /**
   * Validate GHL SSO token and return session info
   */
  validateSsoToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
        locationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // TODO: Implement actual GHL SSO token validation
      // Find community first
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found",
        });
      }

      // Validate the SSO token with GHL's API
      // In production, this would:
      // 1. Decode the JWT token
      // 2. Verify signature with GHL's public key
      // 3. Check expiration
      // 4. Extract user/contact information

      // For now, we return a structure indicating validation is needed
      // In a real implementation, you would make an API call to GHL
      // to validate the token and get user information

      return {
        valid: false,
        message:
          "SSO token validation requires GHL API integration. Please implement JWT verification or API validation.",
        community: {
          id: community.id,
          slug: community.slug,
          name: community.name,
        },
      };
    }),

  /**
   * Get community by GHL location ID
   */
  getCommunityByLocation: publicProcedure
    .input(z.object({ locationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (!community) {
        return null;
      }

      // Don't expose sensitive tokens
      return {
        id: community.id,
        name: community.name,
        slug: community.slug,
        themeColor: community.themeColor,
        logoUrl: community.logoUrl,
        hasGhlIntegration: !!community.ghlAccessToken,
      };
    }),

  /**
   * Install GHL app for a location (called during app installation)
   */
  installApp: protectedProcedure
    .input(
      z.object({
        locationId: z.string(),
        companyId: z.string().optional(),
        name: z.string(),
        accessToken: z.string(),
        refreshToken: z.string(),
        expiresIn: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if community already exists
      const existing = await ctx.db.query.communities.findFirst({
        where: eq(communities.ghlLocationId, input.locationId),
      });

      if (existing) {
        // Update tokens
        const [updated] = await ctx.db
          .update(communities)
          .set({
            ghlAccessToken: input.accessToken,
            ghlRefreshToken: input.refreshToken,
            ghlTokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
          })
          .where(eq(communities.id, existing.id))
          .returning();

        return { community: updated, created: false };
      }

      // Create new community
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

      const [community] = await ctx.db
        .insert(communities)
        .values({
          name: input.name,
          slug: `${slug}-${Date.now().toString(36)}`, // Ensure uniqueness
          ghlLocationId: input.locationId,
          ghlAccessToken: input.accessToken,
          ghlRefreshToken: input.refreshToken,
          ghlTokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
        })
        .returning();

      if (!community) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create community",
        });
      }

      // Add current user as owner
      await ctx.db.insert(members).values({
        userId: ctx.session.user.id,
        communityId: community.id,
        role: "owner",
      });

      return { community, created: true };
    }),
} satisfies TRPCRouterRecord;
