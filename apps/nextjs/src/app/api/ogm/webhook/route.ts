import { and, eq } from "@ogm/db";
import { db } from "@ogm/db/client";
import { communities, members } from "@ogm/db/schema";
import { type NextRequest, NextResponse } from "next/server";

// import { env } from "~/env";

/**
 * GHL Webhook Handler
 *
 * Handles incoming webhooks from GoHighLevel for:
 * - Contact creation/updates
 * - Tag updates
 * - Location app installation
 */

interface GHLWebhookPayload {
  type: string;
  locationId: string;
  contactId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  // Add more fields as needed based on GHL webhook documentation
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(body) as GHLWebhookPayload;

    // TODO: Verify webhook signature
    // Verify webhook signature to ensure it's from GHL
    const signature = request.headers.get("x-ghl-signature");
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("[GHL Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    } else if (webhookSecret) {
      // Secret is configured but no signature provided
      console.error("[GHL Webhook] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    // If no webhook secret is configured, skip verification (development mode)

    // Find the community for this location
    const community = await db.query.communities.findFirst({
      where: eq(communities.ghlLocationId, payload.locationId),
    });

    if (!community) {
      console.log(
        `[GHL Webhook] No community found for location: ${payload.locationId}`,
      );
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    // Handle different webhook types
    switch (payload.type) {
      case "ContactCreate":
      case "ContactUpdate":
        await handleContactUpdate(community.id, payload);
        break;

      case "ContactTagUpdate":
        await handleTagUpdate(community.id, payload);
        break;

      case "LocationAppInstall":
        // This is typically handled by the OAuth flow, not webhooks
        console.log(
          `[GHL Webhook] App installed for location: ${payload.locationId}`,
        );
        break;

      default:
        console.log(`[GHL Webhook] Unhandled webhook type: ${payload.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GHL Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleContactUpdate(
  communityId: string,
  payload: GHLWebhookPayload,
) {
  if (!payload.contactId || !payload.email) {
    console.log("[GHL Webhook] Missing contactId or email in payload");
    return;
  }

  // Find existing member by GHL contact ID
  const existingMember = await db.query.members.findFirst({
    where: and(
      eq(members.communityId, communityId),
      eq(members.ghlContactId, payload.contactId),
    ),
  });

  if (existingMember) {
    // Update existing member's tags
    await db
      .update(members)
      .set({
        ghlTags: payload.tags ?? [],
      })
      .where(eq(members.id, existingMember.id));

    console.log(`[GHL Webhook] Updated member: ${existingMember.id}`);
  } else {
    // Note: We don't auto-create users from webhooks
    // Users are created when they first access the app via SSO
    console.log(
      `[GHL Webhook] Contact ${payload.contactId} not yet linked to a member`,
    );
  }
}

async function handleTagUpdate(
  communityId: string,
  payload: GHLWebhookPayload,
) {
  if (!payload.contactId) {
    console.log("[GHL Webhook] Missing contactId in tag update payload");
    return;
  }

  // Find member by GHL contact ID
  const member = await db.query.members.findFirst({
    where: and(
      eq(members.communityId, communityId),
      eq(members.ghlContactId, payload.contactId),
    ),
  });

  if (!member) {
    console.log(
      `[GHL Webhook] Member not found for contact: ${payload.contactId}`,
    );
    return;
  }

  // Update tags
  await db
    .update(members)
    .set({
      ghlTags: payload.tags ?? [],
    })
    .where(eq(members.id, member.id));

  console.log(`[GHL Webhook] Updated tags for member: ${member.id}`);
}

// Support GET for webhook verification (some platforms require this)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}
