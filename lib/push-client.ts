/* Client-side push helpers, shared by the "enable notifications" banner and the per-product notify-me flow. */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Ensures a push subscription exists (requesting permission + subscribing if
 * needed) and persists it server-side. Returns the subscription's endpoint,
 * which the notify-me flow uses to link a NotifyRequest to a PushSubscription.
 * Throws (in Persian) on any failure so callers can toast the message.
 */
export async function subscribeToPush(): Promise<string> {
  if (!pushSupported()) {
    throw new Error("مرورگر شما از اعلان‌ها پشتیبانی نمی‌کند.");
  }
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error("کلید اعلان‌ها پیکربندی نشده است.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("برای دریافت اعلان، باید اجازهٔ آن را بدهید.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!res.ok) {
    throw new Error("ثبت اشتراک اعلان با خطا مواجه شد.");
  }

  return subscription.endpoint;
}
