import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";

import { ChannelManager } from "./_components/channel-manager";
import { CommunityEditForm } from "./_components/community-edit-form";
import { GhlIntegration } from "./_components/ghl-integration";

interface CommunityEditPageProps {
  params: Promise<{ communityId: string }>;
}

export default async function CommunityEditPage({
  params,
}: CommunityEditPageProps) {
  const { communityId } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
    with: {
      channels: true,
    },
  });

  if (!community) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Edit Community</h1>
        <p className="text-muted-foreground">
          Update your community settings and configuration.
        </p>
      </div>

      {/* Basic settings */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Basic Settings</h2>
        <div className="mt-4">
          <CommunityEditForm community={community} />
        </div>
      </div>

      {/* GHL Integration */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">GoHighLevel Integration</h2>
        <div className="mt-4">
          <GhlIntegration community={community} />
        </div>
      </div>

      {/* Channel management */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="mt-4">
          <ChannelManager
            communityId={community.id}
            channels={community.channels}
          />
        </div>
      </div>
    </div>
  );
}
