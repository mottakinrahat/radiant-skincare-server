import axios from "axios";
import prisma from "../../../shared/prisma";

interface PathaoOrderPayload {
  store_id?: number | string;
  merchant_order_id?: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: number | string;
  recipient_zone?: number | string;
  recipient_area?: number | string;
  delivery_type?: number;
  item_type?: number;
  special_instruction?: string;
  item_quantity?: number;
  item_weight?: number;
  amount_to_collect: number;
  item_description?: string;
}

function sanitizeBaseUrl(rawUrl?: string | null, fallback: string = "https://api-hermes.pathao.com"): string {
  let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
  if (!url) return fallback;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

function formatPathaoError(responseData: any, fallbackMessage: string): string {
  let mainMsg = responseData?.message || responseData?.error || fallbackMessage;
  if (responseData?.errors && typeof responseData.errors === "object") {
    const details = Object.entries(responseData.errors)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
    mainMsg = `${mainMsg} (${details})`;
  }
  return mainMsg;
}

export class PathaoService {
  private static async getCredentials() {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });

    return {
      clientId: settings?.pathaoClientId || "",
      clientSecret: settings?.pathaoClientSecret || "",
      username: settings?.pathaoUsername || "",
      password: settings?.pathaoPassword || "",
      baseUrl: sanitizeBaseUrl((settings as any)?.pathaoBaseUrl, "https://api-hermes.pathao.com"),
    };
  }

  /**
   * Issue access token from Pathao API
   */
  static async getAccessToken(): Promise<string | null> {
    const creds = await this.getCredentials();
    if (!creds.clientId || !creds.clientSecret || !creds.username || !creds.password) {
      return null;
    }

    try {
      const response = await axios.post(
        `${creds.baseUrl}/aladdin/api/v1/issue-token`,
        {
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          username: creds.username,
          password: creds.password,
          grant_type: "password",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      return response.data?.access_token || null;
    } catch {
      return null;
    }
  }

  /**
   * Create order in Pathao Courier
   */
  static async createOrder(payload: PathaoOrderPayload) {
    const token = await this.getAccessToken();
    const creds = await this.getCredentials();

    if (!token) {
      return {
        success: false,
        message: "Failed to authenticate with Pathao API. Please verify Pathao credentials in Store Settings.",
      };
    }

    try {
      const response = await axios.post(
        `${creds.baseUrl}/aladdin/api/v1/orders`,
        {
          store_id: payload.store_id || 1,
          merchant_order_id: payload.merchant_order_id,
          recipient_name: payload.recipient_name,
          recipient_phone: payload.recipient_phone,
          recipient_address: payload.recipient_address,
          recipient_city: payload.recipient_city || 1,
          recipient_zone: payload.recipient_zone || 1,
          delivery_type: payload.delivery_type || 48,
          item_type: payload.item_type || 2,
          special_instruction: payload.special_instruction || "",
          item_quantity: payload.item_quantity || 1,
          item_weight: payload.item_weight || 0.5,
          amount_to_collect: payload.amount_to_collect,
          item_description: payload.item_description || "Ecommerce Parcel",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = response.data;
      const consignmentId = json?.data?.consignment_id || json?.consignment_id || null;

      if (!consignmentId || json?.type === "error") {
        return {
          success: false,
          message: formatPathaoError(json, "Pathao rejected order creation"),
          error: json,
        };
      }

      return {
        success: true,
        data: json,
        consignmentId: String(consignmentId),
        trackingCode: String(consignmentId),
      };
    } catch (error: any) {
      const errRes = error.response?.data;
      return {
        success: false,
        message: formatPathaoError(errRes, error.message || "Failed to create Pathao order"),
        error: errRes || error.message,
      };
    }
  }
}
