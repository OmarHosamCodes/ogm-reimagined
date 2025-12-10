import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { posts } from "@ogm/db/schema";

import { CommentSection } from "./_components/comment-section";
import { PostDetail } from "./_components/post-detail";

interface PostPageProps {
  params: Promise<{ slug: string; postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, postId } = await params;

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      author: {
        with: {
          user: true,
        },
      },
      channel: true,
      community: true,
    },
  });

  if (!post) {
    notFound();
  }

  // Verify post belongs to this community
  if (post.community.slug !== slug) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PostDetail post={post} />
      <CommentSection postId={postId} />
    </div>
  );
}
