"use client";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ogm/ui";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

interface CommunityNavProps {
  community: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    themeColor: string | null;
  };
  user: {
    name?: string | null;
    email: string;
  };
  member?: {
    role: string | null;
    level: number | null;
    points: number | null;
  };
}

export function CommunityNav({ community, user, member }: CommunityNavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Community Info */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            {community.logoUrl ? (
              <img
                src={community.logoUrl}
                alt={community.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: community.themeColor ?? "#6366f1" }}
              >
                {community.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold">{community.name}</span>
          </Link>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {user.name ?? user.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name ?? user.email}</span>
                  {member && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {member.role} • Level {member.level ?? 1}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/c/${community.slug}/profile`}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/communities/${community.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
                  Switch Community
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
