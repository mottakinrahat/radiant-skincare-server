"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = __importStar(require("bcrypt"));
const prisma_1 = __importDefault(require("./shared/prisma"));
const prisma_2 = require("../prisma/generated/prisma");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("🌱 Seeding database...");
        // 1. Create/Upsert Super Admin
        const adminEmail = "admin@annabiasmart.com";
        const hashedPassword = yield bcrypt.hash("password123", 12);
        const admin = yield prisma_1.default.user.upsert({
            where: { email: adminEmail },
            update: {
                role: prisma_2.UserRole.SUPER_ADMIN,
                status: prisma_2.UserStatus.ACTIVE,
                password: hashedPassword,
            },
            create: {
                name: "Super Admin",
                email: adminEmail,
                password: hashedPassword,
                role: prisma_2.UserRole.SUPER_ADMIN,
                status: prisma_2.UserStatus.ACTIVE,
                needPasswordChange: false,
                contactNumber: "+880 1700-000000",
            },
        });
        console.log("✅ Admin user ready:", admin.email);
        // 2. Create/Upsert StoreSettings
        const settings = yield prisma_1.default.storeSettings.upsert({
            where: { id: "singleton" },
            update: {},
            create: {
                id: "singleton",
                storeName: "Annabia's Mart",
                supportEmail: "support@annabiasmart.com",
                supportPhone: "+880 1700-000000",
                address: "Gulshan-1, Dhaka, Bangladesh",
                currency: "BDT",
                currencySymbol: "৳",
                steadfastBaseUrl: "https://portal.packzy.com/api/v1",
                redxBaseUrl: "https://openapi.redx.com.bd/v1.0.0",
            },
        });
        console.log("✅ Store settings initialized:", settings.storeName);
        console.log("🎉 Database seeded successfully!");
    });
}
seed()
    .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$disconnect();
}));
