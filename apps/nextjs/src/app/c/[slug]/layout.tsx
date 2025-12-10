import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members } from "@ogm/db/schema";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getSession } from "~/auth/server";
import { CommunityNav } from "./_components/community-nav";
import { CommunitySidebar } from "./_components/community-sidebar";

interface CommunityLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function CommunityLayout({
  children,
  params,
}: CommunityLayoutProps) {
  const { slug } = await params;

  // Get current session
  const session = await getSession();

  // Fetch community by slug
  const community = await db.query.communities.findFirst({
    where: eq(communities.slug, slug),
    with: {
      channels: {
        orderBy: (channels, { asc }) => [asc(channels.position)],
      },
    },
  });

  if (!community) {
    notFound();
  }

  // Get user's membership if authenticated
  let member = null;
  if (session) {
    member = await db.query.members.findFirst({
      where: and(
        eq(members.userId, session.user.id),
        eq(members.communityId, community.id),
      ),
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      {session && (
        <CommunityNav
          community={community}
          user={session.user}
          member={member ?? undefined}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile, can be toggled */}
        <div className="hidden md:block">
          <CommunitySidebar
            community={community}
            channels={community.channels}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
