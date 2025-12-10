import { type NextRequest, NextResponse } from "next/server";

import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";

// import { env } from "~/env";

/**
 * GHL OAuth Callback Handler
 *
 * Handles the OAuth callback from GoHighLevel after app installation.
 * Exchanges the authorization code for access tokens.
 */

interface GHLTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  locationId: string;
  companyId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const locationId = searchParams.get("locationId");
    const error = searchParams.get("error");

    if (error) {
      console.error("[GHL OAuth] Error from GHL:", error);
      return NextResponse.redirect(
        new URL(`/admin?error=ghl_oauth_${error}`, request.url),
      );
    }

    if (!code || !locationId) {
      return NextResponse.redirect(
        new URL("/admin?error=missing_params", request.url),
      );
    }

    // TODO: Exchange code for tokens
    // In production, you would call GHL's token endpoint:
    // const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //   },
    //   body: new URLSearchParams({
    //     client_id: env.GHL_CLIENT_ID,
    //     client_secret: env.GHL_CLIENT_SECRET,
    //     grant_type: "authorization_code",
    //     code,
    //     redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/ghl/oauth/callback`,
    //   }),
    // });
    //
    // if (!tokenResponse.ok) {
    //   throw new Error("Failed to exchange code for tokens");
    // }
    //
    // const tokens = await tokenResponse.json() as GHLTokenResponse;

    // For now, we'll just check if the community exists
    const existingCommunity = await db.query.communities.findFirst({
      where: eq(communities.ghlLocationId, locationId),
    });

    if (existingCommunity) {
      // Community already exists, update tokens (when implemented)
      console.log(
        `[GHL OAuth] Community already exists for location: ${locationId}`,
      );

      // Redirect to community admin
      return NextResponse.redirect(
        new URL(
          `/admin/communities/${existingCommunity.id}?connected=true`,
          request.url,
        ),
      );
    }

    // Store the location ID in a temporary session/cookie for the setup flow
    // The user will complete community setup after OAuth
    const response = NextResponse.redirect(
      new URL(`/admin/communities/new?locationId=${locationId}`, request.url),
    );

    // Set a temporary cookie with the location ID
    response.cookies.set("ghl_pending_location", locationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error("[GHL OAuth] Error processing callback:", error);
    return NextResponse.redirect(
      new URL("/admin?error=oauth_failed", request.url),
    );
  }
}
