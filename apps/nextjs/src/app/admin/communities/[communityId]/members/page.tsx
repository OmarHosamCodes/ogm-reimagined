import { notFound } from "next/navigation";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members } from "@ogm/db/schema";

import { MembersTable } from "./_components/members-table";

interface MembersPageProps {
  params: Promise<{ communityId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { communityId } = await params;

  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
  });

  if (!community) {
    notFound();
  }

  const membersList = await db.query.members.findMany({
    where: eq(members.communityId, communityId),
    orderBy: (members, { desc }) => [desc(members.points)],
  });

  const stats = {
    total: membersList.length,
    admins: membersList.filter((m) => m.role === "admin" || m.role === "owner")
      .length,
    moderators: membersList.filter((m) => m.role === "moderator").length,
    members: membersList.filter((m) => m.role === "member").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Member Management</h1>
        <p className="text-muted-foreground">
          Manage members in {community.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Members</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold">{stats.admins}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Moderators</p>
          <p className="text-2xl font-bold">{stats.moderators}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Regular Members</p>
          <p className="text-2xl font-bold">{stats.members}</p>
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-lg border">
        <MembersTable members={membersList} communityId={communityId} />
      </div>
    </div>
  );
}
