"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoService = void 0;
const geo_utils_1 = require("./geo.utils");
const BASE_URL = "https://bdapis.com/api/v1.2";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const memoryCache = new Map();
function fetchWithCache(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const cached = memoryCache.get(url);
        const now = Date.now();
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }
        const response = yield fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch geo data from ${url}`);
        }
        const json = yield response.json();
        memoryCache.set(url, { data: json, timestamp: now });
        return json;
    });
}
const getDivisions = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield fetchWithCache(`${BASE_URL}/divisions`);
    const rawList = result.data || [];
    const formatted = rawList.map((item) => ({
        name: item.division,
        bn_name: item.divisionbn || item.division,
    }));
    return {
        success: true,
        data: formatted,
        count: formatted.length,
    };
});
const getDistricts = (divisionName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!divisionName)
        return { success: true, data: [], count: 0 };
    const cleanName = divisionName.trim().toLowerCase();
    const result = yield fetchWithCache(`${BASE_URL}/division/${cleanName}`);
    const rawList = result.data || [];
    const formatted = rawList.map((item) => ({
        name: item.district,
        bn_name: item.districtbn || item.district,
    }));
    return {
        success: true,
        data: formatted,
        count: formatted.length,
    };
});
const getUpazilas = (districtName) => __awaiter(void 0, void 0, void 0, function* () {
    if (!districtName)
        return { success: true, data: [], count: 0 };
    const cleanName = districtName.trim().toLowerCase();
    // Special handling for Dhaka District: Return all Dhaka City Thanas + Outer Upazilas
    if (cleanName === "dhaka") {
        return {
            success: true,
            data: geo_utils_1.DHAKA_CITY_THANAS,
            count: geo_utils_1.DHAKA_CITY_THANAS.length,
        };
    }
    const result = yield fetchWithCache(`${BASE_URL}/district/${cleanName}`);
    const rawList = result.data || [];
    let upazillaArray = [];
    if (rawList.length > 0) {
        upazillaArray = rawList[0].upazillas || rawList[0].upazilla || [];
    }
    const formatted = upazillaArray.map((name) => ({
        name: name,
        bn_name: name,
    }));
    return {
        success: true,
        data: formatted,
        count: formatted.length,
    };
});
const getAllUpazilas = () => __awaiter(void 0, void 0, void 0, function* () {
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
        const divRes = yield fetchWithCache(`${BASE_URL}/divisions`);
        const rawDivisions = divRes.data || [];
        const allUpazilas = [];
        for (const d of rawDivisions) {
            const divName = d.division;
            try {
                const distRes = yield fetchWithCache(`${BASE_URL}/division/${divName.toLowerCase()}`);
                const rawDistricts = distRes.data || [];
                for (const distItem of rawDistricts) {
                    const distName = distItem.district;
                    if (distName.toLowerCase() === "dhaka") {
                        for (const thana of geo_utils_1.DHAKA_CITY_THANAS) {
                            allUpazilas.push({
                                name: thana.name,
                                district: "Dhaka",
                                division: "Dhaka",
                                bn_name: thana.bn_name,
                            });
                        }
                    }
                    else {
                        const upaList = distItem.upazillas || distItem.upazilla || [];
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
            }
            catch (_a) {
                // ignore single division error
            }
        }
        // Deduplicate by lowercased (name + district)
        const seenMap = new Map();
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
    }
    catch (_b) {
        return {
            success: true,
            data: [],
            count: 0,
        };
    }
});
const getDeliveryCharge = (districtName, upazilaName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = (0, geo_utils_1.calculateChargeByName)(districtName, upazilaName);
    return {
        success: true,
        data: result,
    };
});
exports.GeoService = {
    getDivisions,
    getDistricts,
    getUpazilas,
    getAllUpazilas,
    getDeliveryCharge,
};
