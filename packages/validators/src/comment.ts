import { z } from "zod/v4";

// Comment creation schema
export const CreateCommentSchema = z
  .object({
    communityId: z.string().uuid(),
    postId: z.string().uuid(),
    content: z.string().max(10000).optional(),
    voiceNoteUrl: z.url().optional(),
    parentId: z.string().uuid().optional(), // For nested replies
  })
  .refine((data) => data.content || data.voiceNoteUrl, {
    message: "Either content or voice note is required",
  });

// Comment update schema
export const UpdateCommentSchema = z.object({
  communityId: z.string().uuid(),
  commentId: z.string().uuid(),
  content: z.string().max(10000).optional(),
});

// Comment list query schema
export const CommentListQuerySchema = z.object({
  communityId: z.string().uuid(),
  postId: z.string().uuid(),
  parentId: z.string().uuid().optional(), // For fetching replies
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

// Comment delete schema
export const DeleteCommentSchema = z.object({
  communityId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;
export type UpdateComment = z.infer<typeof UpdateCommentSchema>;
export type CommentListQuery = z.infer<typeof CommentListQuerySchema>;
export type DeleteComment = z.infer<typeof DeleteCommentSchema>;
