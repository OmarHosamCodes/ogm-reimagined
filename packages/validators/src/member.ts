import { z } from "zod/v4";

// Member role enum
export const MemberRoleSchema = z.enum([
  "owner",
  "admin",
  "moderator",
  "member",
]);

// Member profile update schema
export const UpdateMemberProfileSchema = z.object({
  communityId: z.string().uuid(),
});

// Member role update schema (admin only)
export const UpdateMemberRoleSchema = z.object({
  communityId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: MemberRoleSchema,
});

// Award points schema
export const AwardPointsSchema = z.object({
  communityId: z.string().uuid(),
  memberId: z.string().uuid(),
  points: z.number().int().min(1).max(10000),
  reason: z.string().max(255).optional(),
});

// Leaderboard query schema
export const LeaderboardQuerySchema = z.object({
  communityId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
});

// Sync GHL tags schema
export const SyncGhlTagsSchema = z.object({
  communityId: z.string().uuid(),
  memberId: z.string().uuid(),
  tags: z.array(z.string()),
});

export type MemberRole = z.infer<typeof MemberRoleSchema>;
export type UpdateMemberProfile = z.infer<typeof UpdateMemberProfileSchema>;
export type UpdateMemberRole = z.infer<typeof UpdateMemberRoleSchema>;
export type AwardPoints = z.infer<typeof AwardPointsSchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export type SyncGhlTags = z.infer<typeof SyncGhlTagsSchema>;
