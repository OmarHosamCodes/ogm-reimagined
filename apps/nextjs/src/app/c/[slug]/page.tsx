import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";

import { CommunityHeader } from "./_components/community-header";
import { PostFeed } from "./_components/post-feed";

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
    with: {
      channels: {
        orderBy: (channels, { asc }) => [asc(channels.position)],
        limit: 1,
      },
    },
  });

  if (!community) {
    notFound();
  }

  // Get the default channel (first channel)
  const defaultChannel = community.channels[0];

  return (
    <div className="space-y-6">
      <CommunityHeader community={community} />

      {defaultChannel ? (
        <PostFeed channelId={defaultChannel.id} communityId={community.id} />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <h3 className="text-lg font-medium">No channels yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This community doesn't have any channels set up yet.
          </p>
        </div>
      )}
    </div>
  );
}
