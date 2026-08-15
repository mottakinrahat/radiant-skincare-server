export const OUTER_DHAKA_UPAZILAS = [
  "savar",
  "dhamrai",
  "keraniganj",
  "nawabganj",
  "dohar",
  "সাভার",
  "ধামরাই",
  "কেরানীগঞ্জ",
  "নবাবগঞ্জ",
  "দোহার",
];

export const DHAKA_CITY_THANAS = [
  { name: "Dhanmondi", bn_name: "ধানমণ্ডি" },
  { name: "Gulshan", bn_name: "গুলশান" },
  { name: "Banani", bn_name: "বনানী" },
  { name: "Uttara", bn_name: "উত্তরা" },
  { name: "Mirpur", bn_name: "মিরপুর" },
  { name: "Mohammadpur", bn_name: "মোহাম্মদপুর" },
  { name: "Motijheel", bn_name: "মতিঝিল" },
  { name: "Shahbagh", bn_name: "শাহবাগ" },
  { name: "Tejgaon", bn_name: "তেজগাঁও" },
  { name: "Ramna", bn_name: "রমনা" },
  { name: "Paltan", bn_name: "পল্টন" },
  { name: "Cantonment", bn_name: "ক্যান্টনমেন্ট" },
  { name: "Lalbagh", bn_name: "লালবাগ" },
  { name: "Sutrapur", bn_name: "সূত্রাপুর" },
  { name: "Hazaribagh", bn_name: "হাজারীবাগ" },
  { name: "Khilgaon", bn_name: "খিলগাঁও" },
  { name: "Jatrabari", bn_name: "যাত্রাবাড়ী" },
  { name: "Badda", bn_name: "বাড্ডা" },
  { name: "Bhatara", bn_name: "ভাটারা" },
  { name: "Rampura", bn_name: "রামপুরা" },
  { name: "Mugda", bn_name: "মুগদা" },
  { name: "Demra", bn_name: "ডেমরা" },
  { name: "Kadamtali", bn_name: "কদমতলী" },
  { name: "Kamrangirchar", bn_name: "কামরাঙ্গীরচর" },
  { name: "Sabujbagh", bn_name: "সবুজবাগ" },
  { name: "Kafrul", bn_name: "কাফরুল" },
  { name: "New Market", bn_name: "নিউ মার্কেট" },
  { name: "Chawkbazar", bn_name: "চকবাজার" },
  { name: "Bangshal", bn_name: "বংশাল" },
  { name: "Turag", bn_name: "তুরাগ" },
  { name: "Uttara West", bn_name: "উত্তরা পশ্চিম" },
  { name: "Uttarkhan", bn_name: "উত্তরখান" },
  { name: "Dakshinkhan", bn_name: "দক্ষিণখান" },
  { name: "Darus Salam", bn_name: "দারুস সালাম" },
  { name: "Shah Ali", bn_name: "শাহ আলী" },
  { name: "Adabor", bn_name: "আদাবর" },
  { name: "Bimanbandar", bn_name: "বিমানবন্দর" },
  { name: "Sher-e-Bangla Nagar", bn_name: "শের-ই-বাংলা নগর" },

  // Outer Dhaka Upazilas
  { name: "Savar", bn_name: "সাভার" },
  { name: "Dhamrai", bn_name: "ধামরাই" },
  { name: "Keraniganj", bn_name: "কেরানীগঞ্জ" },
  { name: "Nawabganj", bn_name: "নবাবগঞ্জ" },
  { name: "Dohar", bn_name: "দোহার" },
];

export interface DeliveryChargeResult {
  charge: number;
  zone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  isInsideDhaka: boolean;
}

/**
 * Core delivery charge engine logic.
 *
 * Inside Dhaka (60tk): district is "dhaka" AND upazila is NOT one of Savar, Dhamrai, Keraniganj, Nawabganj, Dohar.
 * Outside Dhaka (120tk): Any other district or any of the 5 outer Dhaka upazilas.
 */
export function calculateChargeByName(
  districtName?: string,
  upazilaName?: string
): DeliveryChargeResult {
  const dist = String(districtName || "").trim().toLowerCase();
  const upa = String(upazilaName || "").trim().toLowerCase();

  const isDhakaDistrict = dist === "dhaka" || dist.includes("dhaka");
  const isOuterUpazila = OUTER_DHAKA_UPAZILAS.some((name) => upa.includes(name));

  const isInsideDhaka = isDhakaDistrict && !isOuterUpazila;

  return {
    charge: isInsideDhaka ? 60 : 120,
    zone: isInsideDhaka ? "INSIDE_DHAKA" : "OUTSIDE_DHAKA",
    isInsideDhaka,
  };
}
