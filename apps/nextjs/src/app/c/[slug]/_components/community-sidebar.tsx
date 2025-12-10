"use client";

import { Button, cn } from "@ogm/ui";
import { BookOpen, Hash, Lock, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Channel {
  id: string;
  name: string;
  icon: string | null;
  isPrivate: boolean | null;
  position: number | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  themeColor: string | null;
}

interface CommunitySidebarProps {
  community: Community;
  channels: Channel[];
}

export function CommunitySidebar({
  community,
  channels,
}: CommunitySidebarProps) {
  const pathname = usePathname();
  const baseUrl = `/c/${community.slug}`;

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      {/* Community header - Hidden on mobile, shown in top nav instead */}
      <div className="hidden border-b p-4 md:block">
        <Link href={baseUrl} className="flex items-center gap-3">
          {community.logoUrl ? (
            <img
              src={community.logoUrl}
              alt={community.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white"
              style={{ backgroundColor: community.themeColor ?? "#6366f1" }}
            >
              {community.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h2 className="truncate font-semibold">{community.name}</h2>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Main navigation */}
        <div className="space-y-1">
          <SidebarLink
            href={`${baseUrl}/courses`}
            icon={BookOpen}
            label="Courses"
            isActive={pathname.startsWith(`${baseUrl}/courses`)}
          />
          <SidebarLink
            href={`${baseUrl}/leaderboard`}
            icon={Trophy}
            label="Leaderboard"
            isActive={pathname === `${baseUrl}/leaderboard`}
          />
          <SidebarLink
            href={`${baseUrl}/profile`}
            icon={User}
            label="Profile"
            isActive={pathname === `${baseUrl}/profile`}
          />
        </div>

        {/* Channels */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Channels
            </span>
          </div>
          <div className="space-y-0.5">
            {channels.map((channel) => (
              <SidebarLink
                key={channel.id}
                href={`${baseUrl}/channel/${channel.id}`}
                icon={channel.isPrivate ? Lock : Hash}
                label={channel.name}
                isActive={pathname === `${baseUrl}/channel/${channel.id}`}
              />
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
}

function SidebarLink({ href, icon: Icon, label, isActive }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn("w-full justify-start gap-2", isActive && "bg-secondary")}
        size="sm"
      >
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </Button>
    </Link>
  );
}
