import { and, desc, eq } from "@ogm/db";
import { CreateCommunitySchema, communities, members } from "@ogm/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure, publicProcedure } from "../trpc";

export const communityRouter = {
  /**
   * Create a new community (links to GHL Location)
   */
  create: protectedProcedure
    .input(CreateCommunitySchema)
    .mutation(async ({ ctx, input }) => {
      const [community] = await ctx.db
        .insert(communities)
        .values(input)
        .returning();

      if (!community) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create community",
        });
      }

      // Auto-add creator as owner
      await ctx.db.insert(members).values({
        userId: ctx.session.user.id,
        communityId: community.id,
        role: "owner",
      });

      return community;
    }),

  /**
   * Get community by URL slug
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.slug, input.slug),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found",
        });
      }

      return community;
    }),

  /**
   * Get community by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.id, input.id),
      });

      if (!community) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Community not found",
        });
      }

      return community;
    }),

  /**
   * Update community settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        themeColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        logoUrl: z.url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, id),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this community",
        });
      }

      const [updated] = await ctx.db
        .update(communities)
        .set(data)
        .where(eq(communities.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete community
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.id),
        ),
      });

      if (!member || member.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete this community",
        });
      }

      await ctx.db.delete(communities).where(eq(communities.id, input.id));

      return { success: true };
    }),

  /**
   * List community members with pagination
   */
  listMembers: publicProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const membersList = await ctx.db.query.members.findMany({
        where: eq(members.communityId, input.communityId),
        orderBy: desc(members.points),
        limit: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (membersList.length > input.limit) {
        const nextItem = membersList.pop();
        nextCursor = nextItem?.id;
      }

      return {
        members: membersList,
        nextCursor,
      };
    }),

  /**
   * List all communities (for discovery)
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const list = await ctx.db.query.communities.findMany({
        orderBy: desc(communities.createdAt),
        limit: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (list.length > input.limit) {
        const nextItem = list.pop();
        nextCursor = nextItem?.id;
      }

      return {
        communities: list,
        nextCursor,
      };
    }),

  /**
   * Refresh GHL OAuth tokens
   */
  refreshGhlTokens: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to manage GHL integration",
        });
      }

      const community = await ctx.db.query.communities.findFirst({
        where: eq(communities.id, input.communityId),
      });

      if (!community?.ghlRefreshToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No GHL refresh token available",
        });
      }

      // TODO: Implement actual GHL token refresh logic
      // Call GHL's OAuth token refresh endpoint
      const clientId = process.env.GHL_CLIENT_ID;
      const clientSecret = process.env.GHL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "GHL credentials not configured",
        });
      }

      const refreshResponse = await fetch(
        "https://services.leadconnectorhq.com/oauth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: community.ghlRefreshToken,
          }),
        },
      );

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error("[GHL] Token refresh failed:", errorText);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refresh GHL tokens",
        });
      }

      const tokens = (await refreshResponse.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };

      // Update community with new tokens
      const [updatedCommunity] = await ctx.db
        .update(communities)
        .set({
          ghlAccessToken: tokens.access_token,
          ghlRefreshToken: tokens.refresh_token,
          ghlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        })
        .where(eq(communities.id, input.communityId))
        .returning();

      return updatedCommunity;
    }),
} satisfies TRPCRouterRecord;
