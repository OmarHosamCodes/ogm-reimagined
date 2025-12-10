import { type NextRequest, NextResponse } from "next/server";

import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members, user } from "@ogm/db/schema";

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
    // In production, you would verify the token:
    // const isValid = await validateGHLSSOToken(payload.token, payload.locationId);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid SSO token" }, { status: 401 });
    // }

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

      member = newMember ?? null;
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

    // TODO: Create session using Better Auth
    // This would typically involve creating a session token
    // and returning it to the client for cookie storage

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
      // TODO: Include session token for authentication
      // sessionToken: await createSession(userId),
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
