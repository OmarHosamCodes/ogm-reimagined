import { Button } from "@ogm/ui";
import { useNavigate } from "@tanstack/react-router";

import { authClient } from "~/auth/client";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-xl text-muted-foreground">
          No authentication providers configured
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button
        size="lg"
        onClick={async () => {
          await authClient.signOut();
          await navigate({ href: "/", replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
