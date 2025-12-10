"use client";

import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "./index";

interface CommunityAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  logoUrl?: string | null;
  themeColor?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function CommunityAvatar({
  name,
  logoUrl,
  themeColor,
  size = "md",
  className,
  ...props
}: CommunityAvatarProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={cn(sizeClasses[size], className)} {...props}>
      {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
      <AvatarFallback
        style={
          themeColor
            ? { backgroundColor: themeColor, color: "#fff" }
            : undefined
        }
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
