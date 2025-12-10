import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, inArray, sql } from "@ogm/db";
import { members, user } from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const memberRouter = {
  /**
   * Join a community
   */
  join: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        ghlContactId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already a member
      const existingMember = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already a member of this community",
        });
      }

      const [member] = await ctx.db
        .insert(members)
        .values({
          userId: ctx.session.user.id,
          communityId: input.communityId,
          ghlContactId: input.ghlContactId,
          role: "member",
        })
        .returning();

      return member;
    }),

  /**
   * Leave a community
   */
  leave: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this community",
        });
      }

      if (member.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Owner cannot leave the community. Transfer ownership first.",
        });
      }

      await ctx.db
        .delete(members)
        .where(
          and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, input.communityId),
          ),
        );

      return { success: true };
    }),

  /**
   * Get member profile
   */
  getProfile: publicProcedure
    .input(
      z.object({
        memberId: z.string().uuid().optional(),
        communityId: z.string().uuid(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let member:
        | Awaited<ReturnType<typeof ctx.db.query.members.findFirst>>
        | undefined;

      if (input.memberId) {
        member = await ctx.db.query.members.findFirst({
          where: eq(members.id, input.memberId),
          with: {
            community: true,
          },
        });
      } else if (input.userId) {
        member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, input.userId),
            eq(members.communityId, input.communityId),
          ),
          with: {
            community: true,
          },
        });
      }

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Get user info
      const userInfo = await ctx.db.query.user.findFirst({
        where: eq(user.id, member.userId),
      });

      return {
        ...member,
        user: userInfo,
      };
    }),

  /**
   * Get current user's membership in a community
   */
  getMyMembership: protectedProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
        with: {
          community: true,
        },
      });

      return member ?? null;
    }),

  /**
   * Update member role (admin only)
   */
  updateRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get target member
      const targetMember = await ctx.db.query.members.findFirst({
        where: eq(members.id, input.memberId),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Check if current user is admin/owner
      const currentMember = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, targetMember.communityId),
        ),
      });

      if (
        !currentMember ||
        !["owner", "admin"].includes(currentMember.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update roles",
        });
      }

      // Can't change owner's role
      if (targetMember.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change owner's role",
        });
      }

      const [updated] = await ctx.db
        .update(members)
        .set({ role: input.role })
        .where(eq(members.id, input.memberId))
        .returning();

      return updated;
    }),

  /**
   * Award gamification points
   */
  awardPoints: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        points: z.number().int().positive(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get target member
      const targetMember = await ctx.db.query.members.findFirst({
        where: eq(members.id, input.memberId),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      // Check if current user is admin/owner/moderator
      const currentMember = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, targetMember.communityId),
        ),
      });

      if (
        !currentMember ||
        !["owner", "admin", "moderator"].includes(currentMember.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to award points",
        });
      }

      // Update points and potentially level
      const newPoints = (targetMember.points ?? 0) + input.points;
      const newLevel = calculateLevel(newPoints);

      const [updated] = await ctx.db
        .update(members)
        .set({
          points: newPoints,
          level: newLevel,
        })
        .where(eq(members.id, input.memberId))
        .returning();

      return updated;
    }),

  /**
   * Sync GHL tags from webhook
   */
  syncGhlTags: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if current user is admin/owner
      const targetMember = await ctx.db.query.members.findFirst({
        where: eq(members.id, input.memberId),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const currentMember = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, targetMember.communityId),
        ),
      });

      if (
        !currentMember ||
        !["owner", "admin"].includes(currentMember.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to sync tags",
        });
      }

      const [updated] = await ctx.db
        .update(members)
        .set({ ghlTags: input.tags })
        .where(eq(members.id, input.memberId))
        .returning();

      return updated;
    }),

  /**
   * Get leaderboard for a community
   */
  leaderboard: publicProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const leaderboard = await ctx.db.query.members.findMany({
        where: eq(members.communityId, input.communityId),
        orderBy: sql`${members.points} DESC NULLS LAST`,
        limit: input.limit,
      });

      // Get user info for each member
      const userIds = leaderboard.map((m) => m.userId);
      const users =
        userIds.length > 0
          ? await ctx.db.query.user.findMany({
              where: inArray(user.id, userIds),
            })
          : [];

      const userMap = new Map(users.map((u) => [u.id, u]));

      return leaderboard.map((m, index) => ({
        rank: index + 1,
        member: m,
        user: userMap.get(m.userId),
      }));
    }),
} satisfies TRPCRouterRecord;

/**
 * Calculate level based on points
 * Simple formula: level = floor(sqrt(points / 100)) + 1
 */
function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}
