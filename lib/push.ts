import webpush from "web-push";

/* web-push VAPID setup. Configured lazily so importing this module never throws at build time. */
let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushResult {
  ok: boolean;
  /** Set when the push service reports the subscription is gone (410/404) so it can be pruned. */
  expired: boolean;
  statusCode?: number;
}

/** Sends one push; never throws — returns a result the caller can act on. */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
    );
    return { ok: true, expired: false };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    const expired = statusCode === 404 || statusCode === 410;
    return { ok: false, expired, statusCode };
  }
}
