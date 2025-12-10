import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq } from "@ogm/db";
import { CreateChannelSchema, channels, members } from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const channelRouter = {
  /**
   * Create a new channel
   */
  create: protectedProcedure
    .input(CreateChannelSchema)
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
          message: "You do not have permission to create channels",
        });
      }

      // Get max position
      const existingChannels = await ctx.db.query.channels.findMany({
        where: eq(channels.communityId, input.communityId),
        orderBy: asc(channels.position),
      });

      const maxPosition =
        existingChannels.length > 0
          ? Math.max(...existingChannels.map((c) => c.position ?? 0))
          : 0;

      const [channel] = await ctx.db
        .insert(channels)
        .values({
          ...input,
          position: maxPosition + 1,
        })
        .returning();

      return channel;
    }),

  /**
   * List channels for a community (respects GHL tag permissions)
   */
  list: publicProcedure
    .input(z.object({ communityId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const channelList = await ctx.db.query.channels.findMany({
        where: eq(channels.communityId, input.communityId),
        orderBy: asc(channels.position),
      });

      // If user is logged in, filter by permissions
      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, input.communityId),
          ),
        });

        if (member) {
          // Admins/owners see all channels
          if (["owner", "admin", "moderator"].includes(member.role ?? "")) {
            return channelList;
          }

          // Filter private channels by GHL tags
          const memberTags = (member.ghlTags as string[]) ?? [];
          return channelList.filter((channel) => {
            if (!channel.isPrivate) return true;
            const requiredTags = (channel.requiredGhlTags as string[]) ?? [];
            if (requiredTags.length === 0) return true;
            return requiredTags.some((tag) => memberTags.includes(tag));
          });
        }
      }

      // Non-authenticated users only see public channels
      return channelList.filter((c) => !c.isPrivate);
    }),

  /**
   * Get channel by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.query.channels.findFirst({
        where: eq(channels.id, input.id),
        with: {
          community: true,
        },
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check access for private channels
      if (channel.isPrivate && ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, channel.communityId),
          ),
        });

        if (!member) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this channel",
          });
        }

        // Check GHL tag access
        if (!["owner", "admin", "moderator"].includes(member.role ?? "")) {
          const memberTags = (member.ghlTags as string[]) ?? [];
          const requiredTags = (channel.requiredGhlTags as string[]) ?? [];
          if (
            requiredTags.length > 0 &&
            !requiredTags.some((tag) => memberTags.includes(tag))
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You do not have access to this channel",
            });
          }
        }
      } else if (channel.isPrivate) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be logged in to access this channel",
        });
      }

      return channel;
    }),

  /**
   * Update channel
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        icon: z.string().max(50).optional(),
        isPrivate: z.boolean().optional(),
        requiredGhlTags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const channel = await ctx.db.query.channels.findFirst({
        where: eq(channels.id, id),
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, channel.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this channel",
        });
      }

      const [updated] = await ctx.db
        .update(channels)
        .set(data)
        .where(eq(channels.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete channel
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const channel = await ctx.db.query.channels.findFirst({
        where: eq(channels.id, input.id),
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, channel.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this channel",
        });
      }

      await ctx.db.delete(channels).where(eq(channels.id, input.id));

      return { success: true };
    }),

  /**
   * Reorder channels
   */
  reorder: protectedProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        channelIds: z.array(z.string().uuid()),
      }),
    )
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
          message: "You do not have permission to reorder channels",
        });
      }

      // Update positions
      await Promise.all(
        input.channelIds.map((id, index) =>
          ctx.db
            .update(channels)
            .set({ position: index })
            .where(eq(channels.id, id)),
        ),
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
