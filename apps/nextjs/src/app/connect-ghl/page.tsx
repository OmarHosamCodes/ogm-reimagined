"use client";

import { Button } from "@ogm/ui";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export default function GHLConnectPage() {
  const [clientId, setClientId] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    // Get the redirect URI from current origin
    setRedirectUri(`${window.location.origin}/api/ogm/oauth/callback`);
  }, []);

  const startOAuthFlow = () => {
    if (!clientId) {
      alert("Please enter your GHL Client ID");
      return;
    }

    const scopes = [
      "contacts.readonly",
      "contacts.write",
      "locations.readonly",
      "users.readonly",
    ].join(" ");

    const oauthUrl = new URL(
      "https://marketplace.gohighlevel.com/oauth/chooselocation",
    );
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("scope", scopes);

    // Redirect to GHL OAuth
    window.location.href = oauthUrl.toString();
  };

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <div className="space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Connect GoHighLevel</h1>
          <p className="text-muted-foreground">
            Connect your GoHighLevel location to create a community
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h2 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
              Before You Start
            </h2>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• You need to be an admin of a GHL location</li>
              <li>• Make sure your OAuth app is configured in GHL</li>
              <li>• The redirect URI must match your OAuth app settings</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GHL Client ID</label>
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Enter your GHL Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found in your GHL OAuth app settings
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Redirect URI</label>
            <input
              type="text"
              className="w-full rounded-md border bg-muted px-3 py-2"
              value={redirectUri}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Make sure this matches your GHL OAuth app settings
            </p>
          </div>

          <Button onClick={startOAuthFlow} className="w-full" size="lg">
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect to GoHighLevel
          </Button>
        </div>

        <div className="space-y-2 border-t pt-4">
          <h3 className="font-semibold">What happens next?</h3>
          <ol className="space-y-1 text-sm text-muted-foreground">
            <li>1. You'll be redirected to GoHighLevel</li>
            <li>2. Select the location you want to connect</li>
            <li>3. Authorize the app permissions</li>
            <li>4. You'll be redirected back to complete setup</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
