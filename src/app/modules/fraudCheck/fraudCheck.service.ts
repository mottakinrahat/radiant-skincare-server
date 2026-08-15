import prisma from "../../../shared/prisma";

export interface FraudCheckResponse {
  success: boolean;
  phone: string;
  totalParcels: number;
  totalDelivered: number;
  totalCancelled: number;
  successRate: number;
  riskLevel: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "UNKNOWN";
  couriers: Record<
    string,
    { delivered: number; cancelled: number; total: number; successRate: number }
  >;
  rawResponse?: any;
  message?: string;
}

export class FraudCheckService {
  private static cleanPhoneNumber(phone: string): string {
    if (!phone) return "";
    let digits = phone.replace(/[^\d]/g, "");
    if (digits.startsWith("880") && digits.length === 13) {
      digits = digits.substring(2);
    }
    return digits;
  }

  static async checkByPhone(phone: string): Promise<FraudCheckResponse> {
    let apiKey = process.env.FRAUD_BD_API_KEY;

    if (!apiKey) {
      try {
        const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
        if (settings?.fraudBdApiKey) {
          apiKey = settings.fraudBdApiKey;
        }
      } catch {
        // ignore
      }
    }

    if (!apiKey) {
      apiKey = "1302e523911213bc507c3c6dd35ebdb908044b42982345012452ac8f86406cc9";
    }

    const baseUrl = process.env.FRAUD_BD_BASE_URL || "https://fraudbd.com";

    const cleanPhone = this.cleanPhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 11) {
      return {
        success: false,
        phone,
        totalParcels: 0,
        totalDelivered: 0,
        totalCancelled: 0,
        successRate: 0,
        riskLevel: "UNKNOWN",
        couriers: {},
        message: `Invalid Bangladeshi mobile number: "${phone}"`,
      };
    }

    try {
      const response = await fetch(`${baseUrl}/api/check-courier-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_key: apiKey,
        },
        body: JSON.stringify({ phone_number: cleanPhone }),
      });

      const responseText = await response.text();
      let resData: any = {};

      try {
        resData = JSON.parse(responseText);
      } catch {
        resData = { message: responseText };
      }

      if (!response.ok) {
        console.warn("[FraudCheckService] FraudBD API warning:", resData);
      }

      // Parse data fields flexibly from FraudBD response
      const dataObj = resData?.data || resData?.result || resData || {};

      let totalDelivered = Number(
        dataObj.total_delivered || dataObj.delivered || dataObj.delivered_parcels || 0
      );
      let totalCancelled = Number(
        dataObj.total_cancelled || dataObj.cancelled || dataObj.returned || dataObj.cancelled_parcels || 0
      );
      let totalParcels = Number(
        dataObj.total_parcels || dataObj.total || totalDelivered + totalCancelled || 0
      );

      const courierMap: Record<
        string,
        { delivered: number; cancelled: number; total: number; successRate: number }
      > = {};

      // If FraudBD provides courier-wise stats
      const rawCouriers = dataObj.couriers || dataObj.courier_details || dataObj.details || {};

      if (typeof rawCouriers === "object" && rawCouriers !== null) {
        for (const [key, val] of Object.entries(rawCouriers)) {
          const courierVal = val as any;
          const del = Number(courierVal?.delivered || courierVal?.total_delivered || 0);
          const canc = Number(courierVal?.cancelled || courierVal?.total_cancelled || courierVal?.returned || 0);
          const tot = Number(courierVal?.total || del + canc || 0);
          const rate = tot > 0 ? Math.round((del / tot) * 100) : 0;

          courierMap[key] = {
            delivered: del,
            cancelled: canc,
            total: tot,
            successRate: rate,
          };
        }
      }

      // If totalParcels is still 0 but sum of courierMap > 0
      const sumDelivered = Object.values(courierMap).reduce((acc, c) => acc + c.delivered, 0);
      const sumCancelled = Object.values(courierMap).reduce((acc, c) => acc + c.cancelled, 0);

      if (totalParcels === 0 && (sumDelivered > 0 || sumCancelled > 0)) {
        totalDelivered = sumDelivered;
        totalCancelled = sumCancelled;
        totalParcels = sumDelivered + sumCancelled;
      }

      const successRate =
        totalParcels > 0 ? Math.round((totalDelivered / totalParcels) * 100) : 0;

      let riskLevel: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "UNKNOWN" = "UNKNOWN";

      if (totalParcels > 0) {
        if (successRate >= 80) {
          riskLevel = "LOW_RISK";
        } else if (successRate >= 50) {
          riskLevel = "MEDIUM_RISK";
        } else {
          riskLevel = "HIGH_RISK";
        }
      }

      return {
        success: true,
        phone: cleanPhone,
        totalParcels,
        totalDelivered,
        totalCancelled,
        successRate,
        riskLevel,
        couriers: courierMap,
        rawResponse: resData,
      };
    } catch (error: any) {
      console.error("[FraudCheckService] Error querying FraudBD API:", error);
      return {
        success: false,
        phone: cleanPhone,
        totalParcels: 0,
        totalDelivered: 0,
        totalCancelled: 0,
        successRate: 0,
        riskLevel: "UNKNOWN",
        couriers: {},
        message: error?.message || "Failed to query FraudBD API",
      };
    }
  }
}
