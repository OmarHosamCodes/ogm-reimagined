import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, sql } from "@ogm/db";
import {
  CreatePostSchema,
  channels,
  comments,
  likes,
  members,
  posts,
  user,
} from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  /**
   * Create a new post in a channel
   */
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ ctx, input }) => {
      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, input.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to post",
        });
      }

      // Check channel access
      const channel = await ctx.db.query.channels.findFirst({
        where: eq(channels.id, input.channelId),
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check private channel access
      if (
        channel.isPrivate &&
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        const memberTags = (member.ghlTags as string[]) ?? [];
        const requiredTags = (channel.requiredGhlTags as string[]) ?? [];
        if (
          requiredTags.length > 0 &&
          !requiredTags.some((tag) => memberTags.includes(tag))
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to post in this channel",
          });
        }
      }

      const [post] = await ctx.db
        .insert(posts)
        .values({
          ...input,
          authorId: member.id,
        })
        .returning();

      return post;
    }),

  /**
   * Get a single post with author and comments
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        with: {
          channel: true,
          author: true,
          comments: {
            orderBy: desc(comments.createdAt),
            limit: 50,
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get author user info
      const authorUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, post.author.userId),
      });

      // Check if current user liked this post
      let hasLiked = false;
      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, post.communityId),
          ),
        });

        if (member) {
          const like = await ctx.db.query.likes.findFirst({
            where: and(
              eq(likes.postId, post.id),
              eq(likes.memberId, member.id),
            ),
          });
          hasLiked = !!like;
        }
      }

      return {
        ...post,
        author: {
          ...post.author,
          user: authorUser,
        },
        hasLiked,
      };
    }),

  /**
   * List posts in a channel (paginated)
   */
  listByChannel: publicProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const channel = await ctx.db.query.channels.findFirst({
        where: eq(channels.id, input.channelId),
      });

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Get posts
      const postList = await ctx.db.query.posts.findMany({
        where: eq(posts.channelId, input.channelId),
        orderBy: desc(posts.createdAt),
        limit: input.limit + 1,
        with: {
          author: true,
        },
      });

      // Get user info for authors
      const authorUserIds = postList.map((p) => p.author.userId);
      const users = await ctx.db.query.user.findMany({
        where: sql`${user.id} = ANY(${authorUserIds})`,
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Check if current user liked posts
      let memberLikes: string[] = [];
      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, channel.communityId),
          ),
        });

        if (member) {
          const postIds = postList.map((p) => p.id);
          const likesList = await ctx.db.query.likes.findMany({
            where: and(
              sql`${likes.postId} = ANY(${postIds})`,
              eq(likes.memberId, member.id),
            ),
          });
          memberLikes = likesList
            .map((l) => l.postId)
            .filter(Boolean) as string[];
        }
      }

      let nextCursor: string | undefined;
      if (postList.length > input.limit) {
        const nextItem = postList.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: postList.map((p) => ({
          ...p,
          author: {
            ...p.author,
            user: userMap.get(p.author.userId),
          },
          hasLiked: memberLikes.includes(p.id),
        })),
        nextCursor,
      };
    }),

  /**
   * List posts for a community feed (all channels user has access to)
   */
  listByCommunity: publicProcedure
    .input(
      z.object({
        communityId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get accessible channels first
      let accessibleChannelIds: string[] = [];

      const allChannels = await ctx.db.query.channels.findMany({
        where: eq(channels.communityId, input.communityId),
      });

      if (ctx.session?.user) {
        const member = await ctx.db.query.members.findFirst({
          where: and(
            eq(members.userId, ctx.session.user.id),
            eq(members.communityId, input.communityId),
          ),
        });

        if (member) {
          if (["owner", "admin", "moderator"].includes(member.role ?? "")) {
            accessibleChannelIds = allChannels.map((c) => c.id);
          } else {
            const memberTags = (member.ghlTags as string[]) ?? [];
            accessibleChannelIds = allChannels
              .filter((channel) => {
                if (!channel.isPrivate) return true;
                const requiredTags =
                  (channel.requiredGhlTags as string[]) ?? [];
                if (requiredTags.length === 0) return true;
                return requiredTags.some((tag) => memberTags.includes(tag));
              })
              .map((c) => c.id);
          }
        } else {
          accessibleChannelIds = allChannels
            .filter((c) => !c.isPrivate)
            .map((c) => c.id);
        }
      } else {
        accessibleChannelIds = allChannels
          .filter((c) => !c.isPrivate)
          .map((c) => c.id);
      }

      if (accessibleChannelIds.length === 0) {
        return { posts: [], nextCursor: undefined };
      }

      // Get posts from accessible channels
      const postList = await ctx.db.query.posts.findMany({
        where: sql`${posts.channelId} = ANY(${accessibleChannelIds})`,
        orderBy: desc(posts.createdAt),
        limit: input.limit + 1,
        with: {
          author: true,
          channel: true,
        },
      });

      // Get user info for authors
      const authorUserIds = postList.map((p) => p.author.userId);
      const users = await ctx.db.query.user.findMany({
        where: sql`${user.id} = ANY(${authorUserIds})`,
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      let nextCursor: string | undefined;
      if (postList.length > input.limit) {
        const nextItem = postList.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: postList.map((p) => ({
          ...p,
          author: {
            ...p.author,
            user: userMap.get(p.author.userId),
          },
        })),
        nextCursor,
      };
    }),

  /**
   * Update a post
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        content: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.enum(["image", "video", "audio"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, id),
        with: { author: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is author or admin
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, post.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to edit posts",
        });
      }

      if (
        post.author.id !== member.id &&
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts",
        });
      }

      const [updated] = await ctx.db
        .update(posts)
        .set(data)
        .where(eq(posts.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a post
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        with: { author: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is author or admin
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, post.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to delete posts",
        });
      }

      if (
        post.author.id !== member.id &&
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      await ctx.db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    }),

  /**
   * Pin/unpin a post (admin only)
   */
  pin: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if user is admin
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, post.communityId),
        ),
      });

      if (
        !member ||
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can pin posts",
        });
      }

      const [updated] = await ctx.db
        .update(posts)
        .set({ isPinned: input.isPinned })
        .where(eq(posts.id, input.id))
        .returning();

      return updated;
    }),
} satisfies TRPCRouterRecord;
