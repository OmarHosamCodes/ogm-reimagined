import { notFound, redirect } from "next/navigation";

import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members, posts, userProgress } from "@ogm/db/schema";
import { Badge, Progress } from "@ogm/ui";

import { auth } from "~/auth/server";

interface ProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
    with: {
      courses: true,
    },
  });

  if (!community) {
    notFound();
  }

  const member = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.communityId, community.id),
    ),
  });

  if (!member) {
    notFound();
  }

  // Get member's posts
  const memberPosts = await db.query.posts.findMany({
    where: eq(posts.authorId, member.id),
    orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    limit: 10,
    with: {
      channel: true,
    },
  });

  // Get member's course progress
  const progress = await db.query.userProgress.findMany({
    where: eq(userProgress.memberId, member.id),
    with: {
      lesson: {
        with: {
          module: {
            with: {
              course: true,
            },
          },
        },
      },
    },
  });

  // Calculate course completion stats
  const courseProgress = community.courses.map((course) => {
    const completedLessons = progress.filter(
      (p) => p.lesson?.module?.course?.id === course.id,
    ).length;
    return {
      course,
      completedLessons,
    };
  });

  const roleColors: Record<string, string> = {
    owner: "bg-yellow-500/10 text-yellow-500",
    admin: "bg-red-500/10 text-red-500",
    moderator: "bg-blue-500/10 text-blue-500",
    member: "bg-gray-500/10 text-gray-500",
  };

  // Calculate XP for next level (simple formula)
  const currentLevel = member.level ?? 1;
  const currentPoints = member.points ?? 0;
  const pointsForNextLevel = currentLevel * 100;
  const levelProgress = Math.min(
    ((currentPoints % 100) / pointsForNextLevel) * 100,
    100,
  );

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {session.user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{session.user.name}</h1>
              <Badge className={roleColors[member.role ?? "member"]}>
                {member.role ?? "member"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{session.user.email}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Member since {new Date(member.joinedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Level</p>
          <p className="text-4xl font-bold">{currentLevel}</p>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span>Progress to next level</span>
              <span>{currentPoints} pts</span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total Points</p>
          <p className="text-4xl font-bold">{currentPoints}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Posts</p>
          <p className="text-4xl font-bold">{memberPosts.length}</p>
        </div>
      </div>

      {/* GHL Tags */}
      {member.ghlTags && (member.ghlTags as string[]).length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Your Tags</h2>
          <div className="flex flex-wrap gap-2">
            {(member.ghlTags as string[]).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Course Progress */}
      {courseProgress.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Course Progress</h2>
          <div className="space-y-4">
            {courseProgress.map(({ course, completedLessons }) => (
              <div
                key={course.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {completedLessons} lessons completed
                  </p>
                </div>
                <Badge variant={completedLessons > 0 ? "default" : "secondary"}>
                  {completedLessons > 0 ? "In Progress" : "Not Started"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Your Recent Posts</h2>
        <div className="space-y-4">
          {memberPosts.map((post) => (
            <div key={post.id} className="border-b pb-4 last:border-0">
              <p className="font-medium">{post.title}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>in #{post.channel?.name}</span>
                <span>•</span>
                <span>{post.likeCount} likes</span>
                <span>•</span>
                <span>{post.commentCount} comments</span>
                <span>•</span>
                <span>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          ))}
          {memberPosts.length === 0 && (
            <p className="text-muted-foreground">
              You haven't posted anything yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
