import axios from "axios";
import prisma from "../../../shared/prisma";

interface RedXParcelPayload {
  customer_name: string;
  customer_phone: string;
  delivery_area: string;
  delivery_area_id?: number;
  customer_address: string;
  merchant_invoice_id: string;
  cash_collection_amount: number;
  parcel_weight?: number;
  instruction?: string;
  value?: number;
}

function sanitizeBaseUrl(rawUrl?: string | null, fallback: string = "https://openapi.redx.com.bd/v1.0.0"): string {
  let url = (rawUrl && rawUrl.trim()) ? rawUrl.trim() : fallback;
  if (!url) return fallback;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

function formatRedXError(responseData: any, fallbackMessage: string): string {
  let mainMsg = responseData?.message || responseData?.error || fallbackMessage;
  if (Array.isArray(responseData?.validation_errors) && responseData.validation_errors.length > 0) {
    const details = responseData.validation_errors
      .map((item: any) => {
        if (typeof item === "string") return item;
        return Object.entries(item)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      })
      .join("; ");
    mainMsg = `${mainMsg} (${details})`;
  }
  return mainMsg;
}

export class RedXService {
  private static async getCredentials() {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });

    return {
      accessToken: settings?.redxAccessToken || "",
      baseUrl: sanitizeBaseUrl(settings?.redxBaseUrl, "https://openapi.redx.com.bd/v1.0.0"),
    };
  }

  /**
   * Create parcel in RedX Courier
   */
  static async createParcel(payload: RedXParcelPayload) {
    const creds = await this.getCredentials();

    if (!creds.accessToken) {
      return {
        success: false,
        message: "RedX access token missing. Please configure RedX access token in Store Settings.",
      };
    }

    const requestBody = {
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      delivery_area: payload.delivery_area || "Dhaka",
      delivery_area_id: payload.delivery_area_id || 1,
      customer_address: payload.customer_address,
      merchant_invoice_id: payload.merchant_invoice_id,
      cash_collection_amount: payload.cash_collection_amount,
      parcel_weight: payload.parcel_weight || 500,
      instruction: payload.instruction || "",
      value: payload.value || payload.cash_collection_amount,
    };

    const cleanToken = creds.accessToken.replace(/^Bearer\s+/i, "").trim();

    const headers = {
      "Content-Type": "application/json",
      "API-ACCESS-TOKEN": `Bearer ${cleanToken}`,
      Authorization: `Bearer ${cleanToken}`,
    };

    const candidateEndpoints = [
      `${creds.baseUrl}/parcel/create`,
      `${creds.baseUrl}/parcels/create`,
      `${creds.baseUrl}/parcel`,
    ];

    let response: any = null;
    let lastError: any = null;

    for (const endpoint of candidateEndpoints) {
      try {
        response = await axios.post(endpoint, requestBody, { headers });
        if (response?.data) {
          const msg = response.data?.message || "";
          if (msg.includes("specified endpoint") || msg.includes("request method")) {
            continue;
          }
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errData = err.response?.data;
        const errMsg = errData?.message || err.message || "";
        if (
          err.response?.status === 404 ||
          err.response?.status === 405 ||
          errMsg.includes("specified endpoint") ||
          errMsg.includes("request method")
        ) {
          continue;
        }
        break;
      }
    }

    if (!response && lastError) {
      const responseData = lastError.response?.data;
      const errorMessage = formatRedXError(responseData, lastError.message || "Failed to create RedX parcel");
      return {
        success: false,
        message: errorMessage,
        error: responseData || lastError.message,
      };
    }

    const data = response?.data;
    if (!data || data?.success === false) {
      return {
        success: false,
        message: formatRedXError(data, "RedX rejected parcel creation"),
        error: data,
      };
    }

    const trackingCode = data?.tracking_number || data?.parcel?.tracking_number || data?.tracking_id || null;

    if (!trackingCode) {
      return {
        success: false,
        message: formatRedXError(data, "RedX did not return a valid tracking number"),
        error: data,
      };
    }

    return {
      success: true,
      data,
      trackingCode: String(trackingCode),
      consignmentId: String(trackingCode),
    };
  }

  /**
   * Track parcel status in RedX
   */
  static async trackParcel(trackingNumber: string) {
    const creds = await this.getCredentials();
    const cleanToken = creds.accessToken.replace(/^Bearer\s+/i, "").trim();
    try {
      const response = await axios.get(`${creds.baseUrl}/parcels/track/${trackingNumber}`, {
        headers: {
          "Content-Type": "application/json",
          "API-ACCESS-TOKEN": `Bearer ${cleanToken}`,
          Authorization: `Bearer ${cleanToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || null;
    }
  }
}
