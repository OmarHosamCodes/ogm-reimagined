import { eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities } from "@ogm/db/schema";
import { type NextRequest, NextResponse } from "next/server";

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
    // Exchange authorization code for access tokens
    const clientId = process.env.GHL_CLIENT_ID;
    const clientSecret = process.env.GHL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[GHL OAuth] Missing GHL credentials");
      return NextResponse.redirect(
        new URL("/admin?error=missing_ghl_config", request.url),
      );
    }

    const tokenResponse = await fetch(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${new URL(request.url).origin}/api/ogm/oauth/callback`,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[GHL OAuth] Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/admin?error=token_exchange_failed", request.url),
      );
    }

    const tokens = (await tokenResponse.json()) as GHLTokenResponse;

    // For now, we'll just check if the community exists
    const existingCommunity = await db.query.communities.findFirst({
      where: eq(communities.ghlLocationId, locationId),
    });

    if (existingCommunity) {
      // Community already exists, update tokens
      await db
        .update(communities)
        .set({
          ghlAccessToken: tokens.access_token,
          ghlRefreshToken: tokens.refresh_token,
          ghlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        })
        .where(eq(communities.id, existingCommunity.id));

      console.log(
        `[GHL OAuth] Updated tokens for community: ${existingCommunity.id}`,
      );

      // Redirect to community admin
      return NextResponse.redirect(
        new URL(
          `/admin/communities/${existingCommunity.id}?connected=true`,
          request.url,
        ),
      );
    }

    // Store the location ID and tokens in a temporary session/cookie for the setup flow
    // The user will complete community setup after OAuth
    const response = NextResponse.redirect(
      new URL(`/admin/communities/new?locationId=${locationId}`, request.url),
    );

    // Set temporary cookies with the location ID and tokens
    response.cookies.set("ghl_pending_location", locationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set(
      "ghl_pending_tokens",
      JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15, // 15 minutes
      },
    );

    return response;
  } catch (error) {
    console.error("[GHL OAuth] Error processing callback:", error);
    return NextResponse.redirect(
      new URL("/admin?error=oauth_failed", request.url),
    );
  }
}
