import { desc } from "@ogm/db";
import { db } from "@ogm/db/client";
import { courses } from "@ogm/db/schema";
import { Button } from "@ogm/ui";
import { BookOpen, Eye, EyeOff, Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const allCourses = await db.query.courses.findMany({
    orderBy: [desc(courses.createdAt)],
    with: {
      community: true,
      modules: {
        with: {
          lessons: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Manage all courses across communities.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </Link>
      </div>

      {/* Courses table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Course</th>
              <th className="p-3 text-left text-sm font-medium">Community</th>
              <th className="p-3 text-left text-sm font-medium">Modules</th>
              <th className="p-3 text-left text-sm font-medium">Lessons</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allCourses.map((course) => {
              const totalLessons = course.modules.reduce(
                (sum, m) => sum + m.lessons.length,
                0,
              );

              return (
                <tr key={course.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt=""
                          className="h-10 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{course.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {course.community.name}
                  </td>
                  <td className="p-3 text-sm">{course.modules.length}</td>
                  <td className="p-3 text-sm">{totalLessons}</td>
                  <td className="p-3">
                    {course.published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        <Eye className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}

            {allCourses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  No courses yet. Create your first course to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
