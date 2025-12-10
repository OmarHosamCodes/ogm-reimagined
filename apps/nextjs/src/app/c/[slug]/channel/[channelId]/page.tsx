import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { channels } from "@ogm/db/schema";

import { PostFeed } from "../../_components/post-feed";

interface ChannelPageProps {
  params: Promise<{ slug: string; channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug, channelId } = await params;

  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
    with: {
      community: true,
    },
  });

  if (!channel) {
    notFound();
  }

  // Verify the channel belongs to this community
  if (channel.community.slug !== slug) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Channel header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">#</span>
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          {channel.isPrivate && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Private
            </span>
          )}
        </div>
        {channel.description && (
          <p className="mt-2 text-muted-foreground">{channel.description}</p>
        )}
      </div>

      {/* Post feed */}
      <PostFeed channelId={channelId} communityId={channel.communityId} />
    </div>
  );
}
