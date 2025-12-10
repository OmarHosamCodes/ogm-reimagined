import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">
          Unauthorized Access
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You don't have permission to access the admin dashboard.
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Only community owners and administrators can access this area.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
