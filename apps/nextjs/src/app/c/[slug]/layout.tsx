import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <CommunitySidebar community={community} channels={community.channels} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
