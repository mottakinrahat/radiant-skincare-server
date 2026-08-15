import prisma from "../../../shared/prisma";
import { hashEmail, hashPhone } from "./hash.util";

export interface TrackingEventInput {
  eventId: string;
  eventName?: string; // 'Purchase', 'AddToCart', etc.
  email?: string;
  phone?: string;
  value: number;
  currency?: string;
  clientIp?: string;
  userAgent?: string;
  contentIds?: string[];
  customConfig?: {
    metaPixelId?: string;
    metaCapiToken?: string;
    tiktokPixelId?: string;
    tiktokAccessToken?: string;
  };
}

export class TrackingService {
  /**
   * Sends a server-side event to Meta Conversions API (CAPI)
   */
  static async sendMetaEvent(input: TrackingEventInput): Promise<void> {
    let metaPixelId =
      input.customConfig?.metaPixelId || process.env.META_PIXEL_ID;
    let metaToken =
      input.customConfig?.metaCapiToken || process.env.META_CAPI_ACCESS_TOKEN;

    if (!metaPixelId || !metaToken) {
      try {
        const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
        if (!metaPixelId && settings?.metaPixelId) metaPixelId = settings.metaPixelId;
        if (!metaToken && settings?.metaAccessToken) metaToken = settings.metaAccessToken;
      } catch {
        // ignore
      }
    }

    if (!metaPixelId || !metaToken) {
      console.log(
        "[TrackingService] Meta Pixel ID or CAPI Access Token not configured. Skipping Meta CAPI."
      );
      return;
    }

    try {
      const eventName = input.eventName || "Purchase";
      const eventTime = Math.floor(Date.now() / 1000);

      const userData: Record<string, unknown> = {};
      const emHash = hashEmail(input.email);
      const phHash = hashPhone(input.phone);

      if (emHash) userData.em = [emHash];
      if (phHash) userData.ph = [phHash];
      if (input.clientIp) userData.client_ip_address = input.clientIp;
      if (input.userAgent) userData.client_user_agent = input.userAgent;

      const payload = {
        data: [
          {
            event_name: eventName,
            event_time: eventTime,
            event_id: input.eventId,
            action_source: "website",
            user_data: userData,
            custom_data: {
              currency: input.currency || "BDT",
              value: input.value,
              content_ids: input.contentIds || [],
              content_type: "product",
            },
          },
        ],
      };

      const url = `https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        console.warn("[TrackingService] Meta CAPI error response:", resData);
      } else {
        console.log(
          `[TrackingService] Meta CAPI event '${eventName}' sent successfully for eventId: ${input.eventId}`
        );
      }
    } catch (error) {
      console.error("[TrackingService] Failed to send Meta CAPI event:", error);
    }
  }

  /**
   * Sends a server-side event to TikTok Events API (CAPI)
   */
  static async sendTikTokEvent(input: TrackingEventInput): Promise<void> {
    let tiktokPixelId =
      input.customConfig?.tiktokPixelId || process.env.TIKTOK_PIXEL_ID;
    let tiktokToken =
      input.customConfig?.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN;

    if (!tiktokPixelId || !tiktokToken) {
      try {
        const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
        if (!tiktokPixelId && settings?.tiktokPixelId) tiktokPixelId = settings.tiktokPixelId;
      } catch {
        // ignore
      }
    }

    if (!tiktokPixelId || !tiktokToken) {
      console.log(
        "[TrackingService] TikTok Pixel ID or Access Token not configured. Skipping TikTok CAPI."
      );
      return;
    }

    try {
      const eventName =
        input.eventName === "Purchase" || !input.eventName
          ? "CompletePayment"
          : input.eventName;

      const userObj: Record<string, unknown> = {};
      const emHash = hashEmail(input.email);
      const phHash = hashPhone(input.phone);

      if (emHash) userObj.email = emHash;
      if (phHash) userObj.phone_number = phHash;
      if (input.clientIp) userObj.ip = input.clientIp;
      if (input.userAgent) userObj.user_agent = input.userAgent;

      const payload = {
        pixel_code: tiktokPixelId,
        event: eventName,
        event_id: input.eventId,
        timestamp: new Date().toISOString(),
        context: {
          user: userObj,
        },
        properties: {
          currency: input.currency || "BDT",
          value: input.value,
          contents: (input.contentIds || []).map((id) => ({
            content_id: id,
            quantity: 1,
            price: input.value,
          })),
        },
      };

      const url = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Access-Token": tiktokToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok || resData.code !== 0) {
        console.warn("[TrackingService] TikTok CAPI error response:", resData);
      } else {
        console.log(
          `[TrackingService] TikTok CAPI event '${eventName}' sent successfully for eventId: ${input.eventId}`
        );
      }
    } catch (error) {
      console.error("[TrackingService] Failed to send TikTok CAPI event:", error);
    }
  }

  /**
   * Convenience method to track purchase server-side on both Meta and TikTok in parallel
   */
  static async trackPurchase(input: TrackingEventInput): Promise<void> {
    try {
      await Promise.allSettled([
        this.sendMetaEvent({ ...input, eventName: "Purchase" }),
        this.sendTikTokEvent({ ...input, eventName: "CompletePayment" }),
      ]);
    } catch (error) {
      console.error("[TrackingService] trackPurchase non-blocking catch:", error);
    }
  }
}
