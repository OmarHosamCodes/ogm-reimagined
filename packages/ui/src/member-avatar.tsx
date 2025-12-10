"use client";

import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { cn } from "./index";

interface MemberAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  imageUrl?: string | null;
  level?: number | null;
  memberRole?: "owner" | "admin" | "moderator" | "member" | null;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  showRole?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const roleColors: Record<string, string> = {
  owner: "bg-yellow-500",
  admin: "bg-red-500",
  moderator: "bg-blue-500",
  member: "bg-gray-500",
};

export function MemberAvatar({
  name,
  imageUrl,
  level,
  memberRole,
  size = "md",
  showLevel = false,
  showRole = false,
  className,
  ...props
}: MemberAvatarProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative inline-flex", className)} {...props}>
      <Avatar className={cn(sizeClasses[size])}>
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {showLevel && level && (
        <Badge
          variant="secondary"
          className="absolute -bottom-1 -right-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
        >
          {level}
        </Badge>
      )}

      {showRole && memberRole && memberRole !== "member" && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            roleColors[memberRole] || roleColors.member,
          )}
          title={memberRole}
        />
      )}
    </div>
  );
}
