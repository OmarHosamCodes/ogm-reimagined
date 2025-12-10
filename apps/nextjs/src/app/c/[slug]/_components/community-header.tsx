interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  themeColor: string | null;
}

interface CommunityHeaderProps {
  community: Community;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {community.logoUrl ? (
        <img
          src={community.logoUrl}
          alt={community.name}
          className="h-16 w-16 rounded-xl object-cover"
        />
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl text-white text-2xl font-bold"
          style={{ backgroundColor: community.themeColor ?? "#6366f1" }}
        >
          {community.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold">{community.name}</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to the community!
        </p>
      </div>
    </div>
  );
}
