import { calculateChargeByName, DHAKA_CITY_THANAS } from "./geo.utils";

const BASE_URL = "https://bdapis.com/api/v1.2";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = memoryCache.get(url);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch geo data from ${url}`);
  }

  const json = await response.json();
  memoryCache.set(url, { data: json, timestamp: now });
  return json;
}

const getDivisions = async () => {
  const result = await fetchWithCache<any>(`${BASE_URL}/divisions`);
  const rawList = result.data || [];
  const formatted = rawList.map((item: any) => ({
    name: item.division,
    bn_name: item.divisionbn || item.division,
  }));

  return {
    success: true,
    data: formatted,
    count: formatted.length,
  };
};

const getDistricts = async (divisionName: string) => {
  if (!divisionName) return { success: true, data: [], count: 0 };
  const cleanName = divisionName.trim().toLowerCase();
  const result = await fetchWithCache<any>(`${BASE_URL}/division/${cleanName}`);
  const rawList = result.data || [];

  const formatted = rawList.map((item: any) => ({
    name: item.district,
    bn_name: item.districtbn || item.district,
  }));

  return {
    success: true,
    data: formatted,
    count: formatted.length,
  };
};

const getUpazilas = async (districtName: string) => {
  if (!districtName) return { success: true, data: [], count: 0 };
  const cleanName = districtName.trim().toLowerCase();

  // Special handling for Dhaka District: Return all Dhaka City Thanas + Outer Upazilas
  if (cleanName === "dhaka") {
    return {
      success: true,
      data: DHAKA_CITY_THANAS,
      count: DHAKA_CITY_THANAS.length,
    };
  }

  const result = await fetchWithCache<any>(`${BASE_URL}/district/${cleanName}`);
  const rawList = result.data || [];

  let upazillaArray: string[] = [];
  if (rawList.length > 0) {
    upazillaArray = rawList[0].upazillas || rawList[0].upazilla || [];
  }

  const formatted = upazillaArray.map((name: string) => ({
    name: name,
    bn_name: name,
  }));

  return {
    success: true,
    data: formatted,
    count: formatted.length,
  };
};

const getAllUpazilas = async () => {
  const cached = memoryCache.get("all_upazilas_flat");
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      success: true,
      data: cached.data,
      count: cached.data.length,
    };
  }

  try {
    const divRes = await fetchWithCache<any>(`${BASE_URL}/divisions`);
    const rawDivisions = divRes.data || [];

    const allUpazilas: { name: string; district: string; division: string; bn_name?: string }[] = [];

    for (const d of rawDivisions) {
      const divName = d.division;
      try {
        const distRes = await fetchWithCache<any>(`${BASE_URL}/division/${divName.toLowerCase()}`);
        const rawDistricts = distRes.data || [];

        for (const distItem of rawDistricts) {
          const distName = distItem.district;
          if (distName.toLowerCase() === "dhaka") {
            for (const thana of DHAKA_CITY_THANAS) {
              allUpazilas.push({
                name: thana.name,
                district: "Dhaka",
                division: "Dhaka",
                bn_name: thana.bn_name,
              });
            }
          } else {
            const upaList: string[] = distItem.upazillas || distItem.upazilla || [];
            for (const u of upaList) {
              allUpazilas.push({
                name: u,
                district: distName,
                division: divName,
                bn_name: u,
              });
            }
          }
        }
      } catch {
        // ignore single division error
      }
    }

    // Deduplicate by lowercased (name + district)
    const seenMap = new Map<string, any>();
    for (const item of allUpazilas) {
      const key = `${item.name.toLowerCase()}_${item.district.toLowerCase()}`;
      if (!seenMap.has(key)) {
        seenMap.set(key, item);
      }
    }
    const uniqueUpazilas = Array.from(seenMap.values());

    memoryCache.set("all_upazilas_flat", { data: uniqueUpazilas, timestamp: now });

    return {
      success: true,
      data: uniqueUpazilas,
      count: uniqueUpazilas.length,
    };
  } catch {
    return {
      success: true,
      data: [],
      count: 0,
    };
  }
};

const getDeliveryCharge = async (districtName?: string, upazilaName?: string) => {
  const result = calculateChargeByName(districtName, upazilaName);
  return {
    success: true,
    data: result,
  };
};

export const GeoService = {
  getDivisions,
  getDistricts,
  getUpazilas,
  getAllUpazilas,
  getDeliveryCharge,
};
