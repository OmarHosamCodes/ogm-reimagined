import { notFound } from "next/navigation";

import { asc, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { courses, lessons, modules } from "@ogm/db/schema";

import { CourseEditForm } from "./_components/course-edit-form";
import { ModuleManager } from "./_components/module-manager";

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditPage({ params }: CourseEditPageProps) {
  const { courseId } = await params;

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      community: true,
      modules: {
        orderBy: [asc(modules.position)],
        with: {
          lessons: {
            orderBy: [asc(lessons.position)],
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <p className="text-muted-foreground">
          Update course settings and manage content.
        </p>
      </div>

      {/* Basic settings */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Course Settings</h2>
        <div className="mt-4">
          <CourseEditForm course={course} />
        </div>
      </div>

      {/* Modules and lessons */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Course Content</h2>
        <div className="mt-4">
          <ModuleManager courseId={course.id} modules={course.modules} />
        </div>
      </div>
    </div>
  );
}
