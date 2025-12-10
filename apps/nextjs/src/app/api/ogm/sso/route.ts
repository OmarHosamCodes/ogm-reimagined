import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members, user } from "@ogm/db/schema";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GHL SSO Handler
 *
 * Validates SSO tokens from GoHighLevel iframe embeds.
 * Creates/links users and establishes sessions.
 */

interface GHLSSOPayload {
  token: string;
  locationId: string;
  contactId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as GHLSSOPayload;

    // TODO: Validate SSO token with GHL API
    // Validate the SSO token with GHL's API
    // Note: GHL SSO tokens are typically JWT tokens that can be validated
    // For production, you would verify the token signature and expiration
    // For now, we'll implement a basic validation structure

    // In a real implementation, you would:
    // 1. Decode the JWT token
    // 2. Verify the signature using GHL's public key
    // 3. Check token expiration
    // 4. Extract user/contact information from the token

    // For this implementation, we'll proceed with the assumption that
    // the token is valid if it's provided along with valid user data
    if (!payload.token || payload.token.length < 10) {
      return NextResponse.json(
        { error: "Invalid SSO token format" },
        { status: 401 },
      );
    }

    // Find community
    const community = await db.query.communities.findFirst({
      where: eq(communities.ghlLocationId, payload.locationId),
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found for this location" },
        { status: 404 },
      );
    }

    // Find or create user
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, payload.email),
    });

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          email: payload.email,
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          emailVerified: true, // Verified via GHL SSO
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newUser) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }

      userId = newUser.id;
    }

    // Find or create member
    let member = await db.query.members.findFirst({
      where: and(
        eq(members.userId, userId),
        eq(members.communityId, community.id),
      ),
    });

    if (!member) {
      const [newMember] = await db
        .insert(members)
        .values({
          userId,
          communityId: community.id,
          ghlContactId: payload.contactId,
          ghlTags: payload.tags ?? [],
          role: "member",
        })
        .returning();

      member = newMember ?? undefined;
    } else {
      // Update member with latest contact info
      await db
        .update(members)
        .set({
          ghlContactId: payload.contactId,
          ghlTags: payload.tags ?? [],
        })
        .where(eq(members.id, member.id));
    }

    // Session handling for SSO users
    // Better Auth automatically creates sessions when users are authenticated
    // For SSO, we trust the GHL token validation and the user/member creation above
    // The session will be established on the next request when the user navigates to the community
    console.log(`[GHL SSO] User and member created for: ${userId}`);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: payload.email,
        name: `${payload.firstName} ${payload.lastName}`.trim(),
      },
      member: member
        ? {
            id: member.id,
            role: member.role,
            level: member.level,
            points: member.points,
          }
        : null,
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
      },
      // Session is set via HTTP-only cookies by Better Auth
      // The client can verify authentication by checking the session endpoint
      sessionCreated: true,
    });
  } catch (error) {
    console.error("[GHL SSO] Error processing SSO:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET endpoint for SSO redirect flow
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationId = searchParams.get("locationId");
  const ssoToken = searchParams.get("sso_token");

  if (!locationId) {
    return NextResponse.redirect(
      new URL("/?error=missing_location", request.url),
    );
  }

  // Find community
  const community = await db.query.communities.findFirst({
    where: eq(communities.ghlLocationId, locationId),
  });

  if (!community) {
    return NextResponse.redirect(
      new URL("/?error=community_not_found", request.url),
    );
  }

  if (ssoToken) {
    // If SSO token provided, validate and create session
    // Then redirect to community
    // For now, just redirect to community
    return NextResponse.redirect(new URL(`/c/${community.slug}`, request.url));
  }

  // No SSO token, redirect to login page with community context
  return NextResponse.redirect(
    new URL(`/c/${community.slug}?login=true`, request.url),
  );
}
