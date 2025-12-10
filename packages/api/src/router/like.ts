import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, sql } from "@ogm/db";
import { comments, likes, members, posts } from "@ogm/db/schema";

import { protectedProcedure } from "../trpc";

export const likeRouter = {
  /**
   * Toggle like on a post or comment
   */
  toggle: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid().optional(),
        commentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.postId && !input.commentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either postId or commentId is required",
        });
      }

      // Get community ID from post or comment
      let communityId: string;

      if (input.postId) {
        const post = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.postId),
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        communityId = post.communityId;
      } else {
        const comment = await ctx.db.query.comments.findFirst({
          where: eq(comments.id, input.commentId!),
          with: { post: true },
        });

        if (!comment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found",
          });
        }

        communityId = comment.post.communityId;
      }

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to like",
        });
      }

      // Check if already liked
      const existingLike = await ctx.db.query.likes.findFirst({
        where: and(
          eq(likes.memberId, member.id),
          input.postId
            ? eq(likes.postId, input.postId)
            : eq(likes.commentId, input.commentId!),
        ),
      });

      if (existingLike) {
        // Unlike
        await ctx.db.delete(likes).where(eq(likes.id, existingLike.id));

        // Decrement like count
        if (input.postId) {
          await ctx.db
            .update(posts)
            .set({
              likeCount: sql`GREATEST(${posts.likeCount} - 1, 0)`,
            })
            .where(eq(posts.id, input.postId));
        }

        return { liked: false };
      } else {
        // Like
        await ctx.db.insert(likes).values({
          memberId: member.id,
          postId: input.postId ?? null,
          commentId: input.commentId ?? null,
        });

        // Increment like count
        if (input.postId) {
          await ctx.db
            .update(posts)
            .set({
              likeCount: sql`${posts.likeCount} + 1`,
            })
            .where(eq(posts.id, input.postId));
        }

        return { liked: true };
      }
    }),

  /**
   * Check if user liked a post/comment
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid().optional(),
        commentId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.postId && !input.commentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either postId or commentId is required",
        });
      }

      // Get community ID
      let communityId: string;

      if (input.postId) {
        const post = await ctx.db.query.posts.findFirst({
          where: eq(posts.id, input.postId),
        });

        if (!post) {
          return { liked: false };
        }

        communityId = post.communityId;
      } else {
        const comment = await ctx.db.query.comments.findFirst({
          where: eq(comments.id, input.commentId!),
          with: { post: true },
        });

        if (!comment) {
          return { liked: false };
        }

        communityId = comment.post.communityId;
      }

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, communityId),
        ),
      });

      if (!member) {
        return { liked: false };
      }

      // Check if liked
      const like = await ctx.db.query.likes.findFirst({
        where: and(
          eq(likes.memberId, member.id),
          input.postId
            ? eq(likes.postId, input.postId)
            : eq(likes.commentId, input.commentId!),
        ),
      });

      return { liked: !!like };
    }),
} satisfies TRPCRouterRecord;
