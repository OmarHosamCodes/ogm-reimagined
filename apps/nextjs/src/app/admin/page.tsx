import { sql } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, courses, members, posts } from "@ogm/db/schema";

export default async function AdminDashboardPage() {
  // Get counts for dashboard stats
  const [communityCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(communities);

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(members);

  const [courseCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses);

  const [postCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts);

  const stats = [
    {
      name: "Total Communities",
      value: communityCount?.count ?? 0,
      description: "Active communities on the platform",
    },
    {
      name: "Total Members",
      value: memberCount?.count ?? 0,
      description: "Members across all communities",
    },
    {
      name: "Total Courses",
      value: courseCount?.count ?? 0,
      description: "Courses available for learning",
    },
    {
      name: "Total Posts",
      value: postCount?.count ?? 0,
      description: "Posts shared in communities",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's activity.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-lg border p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {stat.name}
            </h3>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 flex gap-4">
          <a
            href="/admin/communities/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Community
          </a>
          <a
            href="/admin/courses/new"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Create Course
          </a>
        </div>
      </div>
    </div>
  );
}
