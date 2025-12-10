import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq, inArray, sql } from "@ogm/db";
import {
  CreateCommentSchema,
  comments,
  members,
  posts,
  user,
} from "@ogm/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const commentRouter = {
  /**
   * Create a comment (supports voice notes)
   */
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the post to find community
      const post = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.postId),
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get member
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, post.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to comment",
        });
      }

      // Validate parent comment if provided
      if (input.parentId) {
        const parentComment = await ctx.db.query.comments.findFirst({
          where: eq(comments.id, input.parentId),
        });

        if (!parentComment || parentComment.postId !== input.postId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid parent comment",
          });
        }
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          ...input,
          authorId: member.id,
        })
        .returning();

      // Increment comment count on post
      await ctx.db
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
        })
        .where(eq(posts.id, input.postId));

      return comment;
    }),

  /**
   * List comments for a post (threaded)
   */
  list: publicProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get top-level comments (no parent)
      const topLevelComments = await ctx.db.query.comments.findMany({
        where: and(
          eq(comments.postId, input.postId),
          sql`${comments.parentId} IS NULL`,
        ),
        orderBy: asc(comments.createdAt),
        limit: input.limit,
        with: {
          author: true,
        },
      });

      // Get all replies for these comments
      const commentIds = topLevelComments.map((c) => c.id);
      const replies =
        commentIds.length > 0
          ? await ctx.db.query.comments.findMany({
              where: inArray(comments.parentId, commentIds),
              orderBy: asc(comments.createdAt),
              with: {
                author: true,
              },
            })
          : [];

      // Get user info for all authors
      const allComments = [...topLevelComments, ...replies];
      const authorUserIds = allComments.map((c) => c.author.userId);
      const users =
        authorUserIds.length > 0
          ? await ctx.db.query.user.findMany({
              where: inArray(user.id, authorUserIds),
            })
          : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Build threaded structure
      const repliesByParent = new Map<string, typeof replies>();
      for (const reply of replies) {
        if (!reply.parentId) continue;
        const existing = repliesByParent.get(reply.parentId) ?? [];
        existing.push(reply);
        repliesByParent.set(reply.parentId, existing);
      }

      return topLevelComments.map((comment) => ({
        ...comment,
        author: {
          ...comment.author,
          user: userMap.get(comment.author.userId),
        },
        replies: (repliesByParent.get(comment.id) ?? []).map((reply) => ({
          ...reply,
          author: {
            ...reply.author,
            user: userMap.get(reply.author.userId),
          },
        })),
      }));
    }),

  /**
   * Update a comment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().optional(),
        voiceNoteUrl: z.url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, id),
        with: {
          author: true,
          post: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user is author or admin
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, comment.post.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to edit comments",
        });
      }

      if (
        comment.author.id !== member.id &&
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      const [updated] = await ctx.db
        .update(comments)
        .set(data)
        .where(eq(comments.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a comment
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.query.comments.findFirst({
        where: eq(comments.id, input.id),
        with: {
          author: true,
          post: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check if user is author or admin
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, comment.post.communityId),
        ),
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member to delete comments",
        });
      }

      if (
        comment.author.id !== member.id &&
        !["owner", "admin", "moderator"].includes(member.role ?? "")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments",
        });
      }

      // Delete comment and its replies
      await ctx.db.delete(comments).where(eq(comments.parentId, input.id));
      await ctx.db.delete(comments).where(eq(comments.id, input.id));

      // Decrement comment count on post
      await ctx.db
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
        })
        .where(eq(posts.id, comment.postId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
