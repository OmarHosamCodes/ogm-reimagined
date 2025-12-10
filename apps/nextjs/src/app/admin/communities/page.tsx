import { desc } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";
import { Button } from "@ogm/ui";
import { ExternalLink, Plus, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminCommunitiesPage() {
  const allCommunities = await db.query.communities.findMany({
    orderBy: [desc(communities.createdAt)],
    with: {
      members: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-muted-foreground">
            Manage all communities on the platform.
          </p>
        </div>
        <Link href="/admin/communities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Community
          </Button>
        </Link>
      </div>

      {/* Communities table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Slug</th>
              <th className="p-3 text-left text-sm font-medium">Members</th>
              <th className="p-3 text-left text-sm font-medium">GHL Status</th>
              <th className="p-3 text-left text-sm font-medium">Created</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allCommunities.map((community) => (
              <tr key={community.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {community.logoUrl && (
                      <img
                        src={community.logoUrl}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">{community.name}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {community.slug}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{community.members.length}</span>
                  </div>
                </td>
                <td className="p-3">
                  {community.ghlLocationId ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                      Not Connected
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(community.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/communities/${community.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/c/${community.slug}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}

            {allCommunities.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-muted-foreground"
                >
                  No communities yet. Create your first community to get
                  started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
