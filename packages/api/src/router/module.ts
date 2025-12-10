import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq } from "@ogm/db";
import { CreateModuleSchema, courses, members, modules } from "@ogm/db/schema";

import { protectedProcedure } from "../trpc";

export const moduleRouter = {
  /**
   * Create a new module
   */
  create: protectedProcedure
    .input(CreateModuleSchema)
    .mutation(async ({ ctx, input }) => {
      // Get course to find community
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create modules",
        });
      }

      // Get max position
      const existingModules = await ctx.db.query.modules.findMany({
        where: eq(modules.courseId, input.courseId),
        orderBy: asc(modules.position),
      });

      const maxPosition =
        existingModules.length > 0
          ? Math.max(...existingModules.map((m) => m.position ?? 0))
          : 0;

      const [module] = await ctx.db
        .insert(modules)
        .values({
          ...input,
          position: maxPosition + 1,
        })
        .returning();

      return module;
    }),

  /**
   * Update a module
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const module = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, id),
        with: { course: true },
      });

      if (!module) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this module",
        });
      }

      const [updated] = await ctx.db
        .update(modules)
        .set(data)
        .where(eq(modules.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a module
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const module = await ctx.db.query.modules.findFirst({
        where: eq(modules.id, input.id),
        with: { course: true },
      });

      if (!module) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Module not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, module.course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this module",
        });
      }

      await ctx.db.delete(modules).where(eq(modules.id, input.id));

      return { success: true };
    }),

  /**
   * Reorder modules
   */
  reorder: protectedProcedure
    .input(
      z.object({
        courseId: z.string().uuid(),
        moduleIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get course to find community
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId),
      });

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      }

      // Check if user is admin/owner
      const member = await ctx.db.query.members.findFirst({
        where: and(
          eq(members.userId, ctx.session.user.id),
          eq(members.communityId, course.communityId),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role ?? "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reorder modules",
        });
      }

      // Update positions
      await Promise.all(
        input.moduleIds.map((id, index) =>
          ctx.db
            .update(modules)
            .set({ position: index })
            .where(eq(modules.id, id)),
        ),
      );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
