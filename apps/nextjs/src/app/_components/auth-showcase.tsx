import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@ogm/ui/button";

import { auth, getSession } from "~/auth/server";

export async function AuthShowcase() {
  const session = await getSession();

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

      <form>
        <Button
          size="lg"
          formAction={async () => {
            "use server";
            await auth.api.signOut({
              headers: await headers(),
            });
            redirect("/");
          }}
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}
