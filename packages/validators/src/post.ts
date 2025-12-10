import { z } from "zod/v4";

// Media type enum
export const MediaTypeSchema = z.enum(["image", "video", "audio"]);

// Post creation schema
export const CreatePostSchema = z.object({
  communityId: z.string().uuid(),
  channelId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().max(50000).optional(),
  mediaUrl: z.url().optional(),
  mediaType: MediaTypeSchema.optional(),
});

// Post update schema
export const UpdatePostSchema = z.object({
  communityId: z.string().uuid(),
  postId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().max(50000).optional(),
  mediaUrl: z.url().optional(),
  mediaType: MediaTypeSchema.optional(),
});

// Post query schema
export const PostListQuerySchema = z.object({
  communityId: z.string().uuid(),
  channelId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(), // For cursor-based pagination
});

// Post pin schema
export const PinPostSchema = z.object({
  communityId: z.string().uuid(),
  postId: z.string().uuid(),
  isPinned: z.boolean(),
});

// Post delete schema
export const DeletePostSchema = z.object({
  communityId: z.string().uuid(),
  postId: z.string().uuid(),
});

// Post get by ID schema
export const GetPostByIdSchema = z.object({
  communityId: z.string().uuid(),
  postId: z.string().uuid(),
});

export type MediaType = z.infer<typeof MediaTypeSchema>;
export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
export type PostListQuery = z.infer<typeof PostListQuerySchema>;
export type PinPost = z.infer<typeof PinPostSchema>;
export type DeletePost = z.infer<typeof DeletePostSchema>;
export type GetPostById = z.infer<typeof GetPostByIdSchema>;
