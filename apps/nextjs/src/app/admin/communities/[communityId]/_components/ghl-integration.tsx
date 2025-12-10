"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, RefreshCw, X } from "lucide-react";
import { useTRPC } from "~/trpc/react";

import { Button } from "@ogm/ui/button";

interface Community {
  id: string;
  ghlLocationId: string | null;
  ghlAccessToken: string | null;
  ghlRefreshToken: string | null;
  ghlTokenExpiresAt: Date | null;
}

interface GhlIntegrationProps {
  community: Community;
}

export function GhlIntegration({ community }: GhlIntegrationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isConnected = !!community.ghlLocationId;
  const isTokenExpired =
    community.ghlTokenExpiresAt &&
    new Date(community.ghlTokenExpiresAt) < new Date();

  const refreshToken = useMutation(
    trpc.community.refreshGhlToken.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }),
  );

  const handleConnect = () => {
    // Redirect to GHL OAuth flow
    const clientId = process.env.NEXT_PUBLIC_GHL_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/ogm/oauth/callback`;
    const state = community.id;

    const authUrl = new URL(
      "https://marketplace.gohighlevel.com/oauth/chooselocation",
    );
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId ?? "");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set(
      "scope",
      "contacts.readonly contacts.write locations.readonly",
    );

    window.location.href = authUrl.toString();
  };

  const handleRefresh = () => {
    refreshToken.mutate({ communityId: community.id });
  };

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            isConnected
              ? isTokenExpired
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isConnected ? (
            isTokenExpired ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Token Expired
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Connected
              </>
            )
          ) : (
            <>
              <X className="h-4 w-4" />
              Not Connected
            </>
          )}
        </div>

        {isConnected && community.ghlLocationId && (
          <span className="text-sm text-muted-foreground">
            Location ID: {community.ghlLocationId}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {!isConnected && (
          <Button onClick={handleConnect}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect to GoHighLevel
          </Button>
        )}

        {isConnected && (
          <>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshToken.isPending}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshToken.isPending ? "animate-spin" : ""}`}
              />
              Refresh Token
            </Button>
            <Button variant="ghost" onClick={handleConnect}>
              Reconnect
            </Button>
          </>
        )}
      </div>

      {/* Token info */}
      {isConnected && community.ghlTokenExpiresAt && (
        <p className="text-sm text-muted-foreground">
          Token expires:{" "}
          {new Date(community.ghlTokenExpiresAt).toLocaleString()}
        </p>
      )}

      {/* Description */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <h4 className="font-medium">What does this do?</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Syncs member data with your GHL contacts</li>
          <li>Enables SSO for GHL iframe embedding</li>
          <li>Allows tag-based content access control</li>
          <li>Receives webhooks for contact events</li>
        </ul>
      </div>

      {refreshToken.error && (
        <p className="text-sm text-destructive">{refreshToken.error.message}</p>
      )}
    </div>
  );
}
