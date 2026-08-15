import axios from "axios";
import config from "../../../config";
import prisma from "../../../shared/prisma";

interface CreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

function sanitizeBaseUrl(rawUrl?: string | null, fallback: string = "https://portal.packzy.com/api/v1"): string {
  let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
  if (!url) return fallback;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

function formatSteadfastError(responseData: any, fallbackMessage: string): string {
  let mainMsg = responseData?.message || responseData?.error || fallbackMessage;
  if (responseData?.errors && typeof responseData.errors === "object") {
    const details = Object.entries(responseData.errors)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
    mainMsg = `${mainMsg} (${details})`;
  }
  return mainMsg;
}

export class SteadfastService {
  private static async getCredentials() {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });
    return {
      apiKey: settings?.steadfastApiKey || config.steadfast.apiKey || "",
      secretKey: settings?.steadfastSecretKey || config.steadfast.secretKey || "",
      baseUrl: sanitizeBaseUrl(settings?.steadfastBaseUrl || config.steadfast.baseUrl, "https://portal.packzy.com/api/v1"),
    };
  }

  /**
   * Create parcel in Steadfast Courier
   */
  static async createParcel(payload: CreateOrderPayload) {
    const creds = await this.getCredentials();

    if (!creds.apiKey || !creds.secretKey) {
      return {
        success: false,
        message: "Steadfast API Key or Secret Key missing. Please configure Steadfast credentials in Store Settings.",
      };
    }

    const url = `${creds.baseUrl}/create_order`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
        },
      });

      const data = response.data;
      const trackingCode = data?.consignment?.tracking_code || data?.tracking_code || null;
      const consignmentId = data?.consignment?.consignment_id ? String(data.consignment.consignment_id) : trackingCode;

      const isSuccess = data?.status === 200 || data?.status === "success" || Boolean(trackingCode);

      if (!isSuccess || !trackingCode) {
        return {
          success: false,
          message: formatSteadfastError(data, "Steadfast rejected parcel creation"),
          error: data,
        };
      }

      return {
        success: true,
        data,
        trackingCode: String(trackingCode),
        consignmentId: String(consignmentId),
      };
    } catch (error: any) {
      const errRes = error.response?.data;
      return {
        success: false,
        message: formatSteadfastError(errRes, error.message || "Failed to create Steadfast parcel"),
        error: errRes || error.message,
      };
    }
  }

  /**
   * Track parcel by tracking code
   */
  static async trackByTrackingCode(trackingCode: string) {
    const creds = await this.getCredentials();
    const url = `${creds.baseUrl}/status_by_trackingcode/${trackingCode}`;
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || null;
    }
  }

  /**
   * Track parcel by invoice ID
   */
  static async trackByInvoice(invoice: string) {
    const creds = await this.getCredentials();
    const url = `${creds.baseUrl}/status_by_invoice/${invoice}`;
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || null;
    }
  }

  /**
   * Check current Steadfast balance
   */
  static async getBalance() {
    const creds = await this.getCredentials();
    const url = `${creds.baseUrl}/get_balance`;
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || null;
    }
  }
}
