"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

interface PostFeedProps {
  channelId: string;
  communityId: string;
}

export function PostFeed({ channelId, communityId }: PostFeedProps) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.post.listByChannel.queryOptions({
      channelId,
      limit: 20,
    }),
  );

  return (
    <div className="space-y-4">
      {/* Post composer */}
      <PostComposer channelId={channelId} communityId={communityId} />

      {/* Posts list */}
      {data.posts.length > 0 ? (
        <div className="space-y-4">
          {data.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-medium">No posts yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to post in this channel!
          </p>
        </div>
      )}

      {/* Load more */}
      {data.nextCursor && (
        <div className="flex justify-center">
          <button className="text-sm text-muted-foreground hover:text-foreground">
            Load more posts
          </button>
        </div>
      )}
    </div>
  );
}
