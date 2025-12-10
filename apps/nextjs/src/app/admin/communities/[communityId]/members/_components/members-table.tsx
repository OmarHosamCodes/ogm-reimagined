"use client";

import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ogm/ui";
import { useState } from "react";

interface Member {
  id: string;
  userId: string;
  communityId: string;
  ghlContactId: string | null;
  ghlTags: string[] | null;
  role: string | null;
  level: number | null;
  points: number | null;
  joinedAt: Date;
}

interface MembersTableProps {
  members: Member[];
  communityId: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-yellow-500/10 text-yellow-500",
  admin: "bg-red-500/10 text-red-500",
  moderator: "bg-blue-500/10 text-blue-500",
  member: "bg-gray-500/10 text-gray-500",
};

export function MembersTable({ members, communityId }: MembersTableProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredMembers = members.filter((member) => {
    if (filter === "all") return true;
    return member.role === filter;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredMembers.length} of {members.length} members
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Points
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                GHL Tags
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Joined
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm">
                    {member.userId.slice(0, 8)}...
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge className={roleColors[member.role ?? "member"]}>
                    {member.role ?? "member"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{member.level ?? 1}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium">
                    {member.points ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(member.ghlTags ?? []).slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(member.ghlTags?.length ?? 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(member.ghlTags?.length ?? 0) - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No members found
        </div>
      )}
    </div>
  );
}
