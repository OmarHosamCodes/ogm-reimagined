import { notFound } from "next/navigation";

import { count, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import {
  channels,
  comments,
  communities,
  courses,
  likes,
  members,
  posts,
  userProgress,
} from "@ogm/db/schema";

import { AnalyticsCharts } from "./_components/analytics-charts";

interface AnalyticsPageProps {
  params: Promise<{ communityId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { communityId } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
  });

  if (!community) {
    notFound();
  }

  // Gather analytics data
  const [
    memberCount,
    channelCount,
    postCount,
    commentCount,
    likeCount,
    courseCount,
    progressCount,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(members)
      .where(eq(members.communityId, communityId)),
    db
      .select({ count: count() })
      .from(channels)
      .where(eq(channels.communityId, communityId)),
    db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.communityId, communityId)),
    db
      .select({ count: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(posts.communityId, communityId)),
    db
      .select({ count: count() })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .where(eq(posts.communityId, communityId)),
    db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.communityId, communityId)),
    db
      .select({ count: count() })
      .from(userProgress)
      .innerJoin(members, eq(userProgress.memberId, members.id))
      .where(eq(members.communityId, communityId)),
  ]);

  // Get top members by points
  const topMembers = await db.query.members.findMany({
    where: eq(members.communityId, communityId),
    orderBy: (members, { desc }) => [desc(members.points)],
    limit: 5,
  });

  // Get recent posts
  const recentPosts = await db.query.posts.findMany({
    where: eq(posts.communityId, communityId),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    limit: 5,
    with: {
      channel: true,
    },
  });

  const stats = {
    members: memberCount[0]?.count ?? 0,
    channels: channelCount[0]?.count ?? 0,
    posts: postCount[0]?.count ?? 0,
    comments: commentCount[0]?.count ?? 0,
    likes: likeCount[0]?.count ?? 0,
    courses: courseCount[0]?.count ?? 0,
    lessonsCompleted: progressCount[0]?.count ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of {community.name} performance
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-3xl font-bold">{stats.members}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Posts</p>
          <p className="text-3xl font-bold">{stats.posts}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Comments</p>
          <p className="text-3xl font-bold">{stats.comments}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Likes</p>
          <p className="text-3xl font-bold">{stats.likes}</p>
        </div>
      </div>

      {/* LMS Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Courses</p>
          <p className="text-3xl font-bold">{stats.courses}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Lessons Completed</p>
          <p className="text-3xl font-bold">{stats.lessonsCompleted}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Channels</p>
          <p className="text-3xl font-bold">{stats.channels}</p>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Members */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Top Members by Points</h2>
          <div className="space-y-4">
            {topMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">
                      User {member.userId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Level {member.level ?? 1}
                    </p>
                  </div>
                </div>
                <span className="font-bold">{member.points ?? 0} pts</span>
              </div>
            ))}
            {topMembers.length === 0 && (
              <p className="text-muted-foreground">No members yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Posts</h2>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="border-b pb-4 last:border-0">
                <p className="font-medium">{post.title}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>in #{post.channel?.name}</span>
                  <span>•</span>
                  <span>{post.likeCount} likes</span>
                  <span>•</span>
                  <span>{post.commentCount} comments</span>
                </div>
              </div>
            ))}
            {recentPosts.length === 0 && (
              <p className="text-muted-foreground">No posts yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for charts */}
      <AnalyticsCharts communityId={communityId} />
    </div>
  );
}
