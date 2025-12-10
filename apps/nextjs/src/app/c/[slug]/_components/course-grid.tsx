"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Lock, Play } from "lucide-react";
import Link from "next/link";
import { useTRPC } from "~/trpc/react";

interface CourseGridProps {
  communityId: string;
}

export function CourseGrid({ communityId }: CourseGridProps) {
  const trpc = useTRPC();

  const { data: courses } = useSuspenseQuery(
    trpc.course.list.queryOptions({ communityId }),
  );

  if (courses.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-medium">No courses yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Check back later for new learning content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} communitySlug={""} />
      ))}
    </div>
  );
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  published: boolean | null;
  isUnlocked: boolean;
}

interface CourseCardProps {
  course: Course;
  communitySlug: string;
}

function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border transition-all hover:shadow-md">
      {/* Thumbnail */}
      <div className="aspect-video bg-muted">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Lock overlay for locked courses */}
        {!course.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white">
              <Lock className="mx-auto h-8 w-8" />
              <p className="mt-2 text-sm">Locked</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2">{course.title}</h3>
        {course.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      {/* Link overlay */}
      {course.isUnlocked && (
        <Link href={`courses/${course.id}`} className="absolute inset-0">
          <span className="sr-only">View {course.title}</span>
        </Link>
      )}
    </div>
  );
}
