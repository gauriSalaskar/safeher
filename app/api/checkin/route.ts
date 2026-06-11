/**
 * POST /api/checkin        → create a new check-in timer
 * PATCH /api/checkin       → user confirms they are safe (cancel escalation)
 * GET  /api/checkin/check  → called by a cron job every minute to escalate overdue check-ins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "@/services/sms";

// ── CREATE a new check-in ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, userName, destination, dueDatetime, contactIds } = await req.json();

    if (!userId || !dueDatetime) {
      return NextResponse.json({ error: "Missing userId or dueDatetime" }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("safe_checkins")
      .insert({
        user_id: userId,
        user_name: userName,
        destination: destination ?? "Not specified",
        due_at: dueDatetime,
        status: "pending",         // pending | safe | escalated
        escalation_level: 0,       // 0 = not escalated, 1 = warning sent, 2 = SOS sent
        contact_ids: contactIds ?? [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, checkin: data });
  } catch (err) {
    console.error("[checkin POST]", err);
    return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 });
  }
}

// ── CONFIRM safe (user tapped "I'm Safe") ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { checkinId, userId } = await req.json();

    const supabase = createClient();

    const { error } = await supabase
      .from("safe_checkins")
      .update({ status: "safe", confirmed_at: new Date().toISOString() })
      .eq("id", checkinId)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[checkin PATCH]", err);
    return NextResponse.json({ error: "Failed to confirm check-in" }, { status: 500 });
  }
}

// ── ESCALATION checker (call this from a Vercel Cron Job every minute) ───────
export async function GET() {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();

    // Find all overdue pending check-ins
    const { data: overdue } = await supabase
      .from("safe_checkins")
      .select(`
        *,
        emergency_contacts (name, phone)
      `)
      .eq("status", "pending")
      .lt("due_at", now);

    if (!overdue || overdue.length === 0) {
      return NextResponse.json({ checked: 0 });
    }

    let escalated = 0;

    for (const checkin of overdue) {
      const minutesOverdue = Math.floor(
        (Date.now() - new Date(checkin.due_at).getTime()) / 60000
      );

      const contacts = checkin.emergency_contacts ?? [];

      // Level 1 — 5 mins overdue: warning SMS to contacts
      if (minutesOverdue >= 5 && checkin.escalation_level < 1) {
        const msg =
          `⚠️ SafeHer Alert: ${checkin.user_name} hasn't checked in. ` +
          `They were supposed to reach ${checkin.destination} by ${new Date(checkin.due_at).toLocaleTimeString("en-IN")}. ` +
          `Please check on them.`;

        await Promise.allSettled(
          contacts.map((c: { phone: string }) => sendSMS({ to: c.phone, body: msg }))
        );

        await supabase
          .from("safe_checkins")
          .update({ escalation_level: 1 })
          .eq("id", checkin.id);

        escalated++;
      }

      // Level 2 — 15 mins overdue: SOS-level alert to contacts
      if (minutesOverdue >= 15 && checkin.escalation_level < 2) {
        const msg =
          `🚨 URGENT — SafeHer: ${checkin.user_name} is 15+ minutes overdue. ` +
          `Last known destination: ${checkin.destination}. ` +
          `Please contact them immediately or call 112.`;

        await Promise.allSettled(
          contacts.map((c: { phone: string }) => sendSMS({ to: c.phone, body: msg }))
        );

        await supabase
          .from("safe_checkins")
          .update({ escalation_level: 2, status: "escalated" })
          .eq("id", checkin.id);

        escalated++;
      }
    }

    return NextResponse.json({ checked: overdue.length, escalated });
  } catch (err) {
    console.error("[checkin GET/cron]", err);
    return NextResponse.json({ error: "Escalation check failed" }, { status: 500 });
  }
}
