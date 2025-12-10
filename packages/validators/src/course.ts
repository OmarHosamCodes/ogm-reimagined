import { z } from "zod/v4";

// Course creation schema
export const CreateCourseSchema = z.object({
  communityId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.url().optional(),
  published: z.boolean().default(false),
  unlockGhlTag: z.string().max(255).optional(),
  unlockLevel: z.number().int().min(1).optional(),
  position: z.number().int().min(0).optional(),
});

// Course update schema
export const UpdateCourseSchema = CreateCourseSchema.partial()
  .omit({ communityId: true })
  .extend({
    communityId: z.string().uuid(),
    courseId: z.string().uuid(),
  });

// Course delete schema
export const DeleteCourseSchema = z.object({
  communityId: z.string().uuid(),
  courseId: z.string().uuid(),
});

// Module creation schema
export const CreateModuleSchema = z.object({
  communityId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  position: z.number().int().min(0).optional(),
});

// Module update schema
export const UpdateModuleSchema = z.object({
  communityId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  position: z.number().int().min(0).optional(),
});

// Module delete schema
export const DeleteModuleSchema = z.object({
  communityId: z.string().uuid(),
  moduleId: z.string().uuid(),
});

// Lesson creation schema
export const CreateLessonSchema = z.object({
  communityId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  videoUrl: z.url().optional(),
  content: z.string().max(50000).optional(),
  isPreview: z.boolean().default(false),
  position: z.number().int().min(0).optional(),
});

// Lesson update schema
export const UpdateLessonSchema = CreateLessonSchema.partial()
  .omit({ communityId: true, moduleId: true })
  .extend({
    communityId: z.string().uuid(),
    lessonId: z.string().uuid(),
  });

// Lesson delete schema
export const DeleteLessonSchema = z.object({
  communityId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

// Progress mark complete schema
export const MarkLessonCompleteSchema = z.object({
  communityId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

// Course progress query schema
export const CourseProgressQuerySchema = z.object({
  communityId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export type CreateCourse = z.infer<typeof CreateCourseSchema>;
export type UpdateCourse = z.infer<typeof UpdateCourseSchema>;
export type DeleteCourse = z.infer<typeof DeleteCourseSchema>;
export type CreateModule = z.infer<typeof CreateModuleSchema>;
export type UpdateModule = z.infer<typeof UpdateModuleSchema>;
export type DeleteModule = z.infer<typeof DeleteModuleSchema>;
export type CreateLesson = z.infer<typeof CreateLessonSchema>;
export type UpdateLesson = z.infer<typeof UpdateLessonSchema>;
export type DeleteLesson = z.infer<typeof DeleteLessonSchema>;
export type MarkLessonComplete = z.infer<typeof MarkLessonCompleteSchema>;
export type CourseProgressQuery = z.infer<typeof CourseProgressQuerySchema>;
