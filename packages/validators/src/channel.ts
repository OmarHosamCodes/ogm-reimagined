import { z } from "zod/v4";

// Channel creation schema
export const CreateChannelSchema = z.object({
  communityId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  isPrivate: z.boolean().default(false),
  requiredGhlTags: z.array(z.string()).default([]),
  position: z.number().int().min(0).optional(),
});

// Channel update schema
export const UpdateChannelSchema = CreateChannelSchema.partial()
  .omit({ communityId: true })
  .extend({
    communityId: z.string().uuid(),
    channelId: z.string().uuid(),
  });

// Channel list query schema
export const ChannelListQuerySchema = z.object({
  communityId: z.string().uuid(),
  includePrivate: z.boolean().default(false),
});

// Channel delete schema
export const DeleteChannelSchema = z.object({
  communityId: z.string().uuid(),
  channelId: z.string().uuid(),
});

export type CreateChannel = z.infer<typeof CreateChannelSchema>;
export type UpdateChannel = z.infer<typeof UpdateChannelSchema>;
export type ChannelListQuery = z.infer<typeof ChannelListQuerySchema>;
export type DeleteChannel = z.infer<typeof DeleteChannelSchema>;
