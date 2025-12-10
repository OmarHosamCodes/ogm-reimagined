import { eq } from "@ogm/db";
import { communities, members, user } from "@ogm/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, publicProcedure } from "../trpc";

/**
 * Auth Router
 * Handles session validation and user authentication helpers
 */
export const authRouter = {
  /**
   * Get current session
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  /**
   * Get current authenticated user
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userInfo = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
    });

    if (!userInfo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return userInfo;
  }),

  /**
   * Get all communities the current user is a member of
   */
  getUserCommunities: protectedProcedure.query(async ({ ctx }) => {
    // Get all memberships for the user
    const memberships = await ctx.db.query.members.findMany({
      where: eq(members.userId, ctx.session.user.id),
      with: {
        community: true,
      },
      orderBy: (members, { desc }) => [desc(members.joinedAt)],
    });

    // Get stats for each community
    const communitiesWithStats = await Promise.all(
      memberships.map(async (membership) => {
        // Count channels in this community
        const channelCount = await ctx.db.query.channels.findMany({
          where: eq(communities.id, membership.communityId),
        });

        // Count total members
        const memberCount = await ctx.db.query.members.findMany({
          where: eq(members.communityId, membership.communityId),
        });

        return {
          ...membership.community,
          membership: {
            id: membership.id,
            role: membership.role,
            level: membership.level,
            points: membership.points,
            joinedAt: membership.joinedAt,
          },
          stats: {
            channelCount: channelCount.length,
            memberCount: memberCount.length,
          },
        };
      }),
    );

    return communitiesWithStats;
  }),

  /**
   * Get user memberships with detailed info
   */
  getUserMemberships: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.members.findMany({
      where: eq(members.userId, ctx.session.user.id),
      with: {
        community: true,
      },
    });

    return memberships;
  }),

  /**
   * Validate session (useful for client-side checks)
   */
  validateSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      return { valid: false, user: null };
    }

    const userInfo = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
    });

    return {
      valid: true,
      user: userInfo,
    };
  }),
} satisfies TRPCRouterRecord;
