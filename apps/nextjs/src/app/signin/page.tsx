import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";

export default async function SignInPage() {
  const session = await getSession();

  // If already signed in, redirect to admin
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In Required</h1>
          <p className="text-muted-foreground">
            This application uses GoHighLevel SSO for authentication.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h2 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              For Community Members
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Access your community through the GoHighLevel app or your
              community&apos;s custom link.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <h2 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
              For Administrators
            </h2>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Sign in through your GoHighLevel account to access the admin
              dashboard.
            </p>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
