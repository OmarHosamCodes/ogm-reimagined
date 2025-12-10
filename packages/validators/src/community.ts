import { z } from "zod/v4";

// Community creation/update schemas for forms
export const CreateCommunityFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  ghlLocationId: z.string().min(1, "GHL Location ID is required").max(255),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  logoUrl: z.url().optional(),
});

export const UpdateCommunityFormSchema =
  CreateCommunityFormSchema.partial().extend({
    id: z.string().uuid(),
  });

export const CommunitySlugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/);

export const CommunityIdSchema = z.string().uuid();

// GHL OAuth tokens schema
export const GhlTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.date(),
});

export type CreateCommunityForm = z.infer<typeof CreateCommunityFormSchema>;
export type UpdateCommunityForm = z.infer<typeof UpdateCommunityFormSchema>;
export type GhlTokens = z.infer<typeof GhlTokensSchema>;
