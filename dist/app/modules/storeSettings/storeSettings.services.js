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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreSettingsServices = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const getSettingsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_2.default.storeSettings.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton" },
    });
});
const upsertSettingsIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {};
    for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined) {
            if (key === "socialLinks" && value === null) {
                data[key] = prisma_1.Prisma.JsonNull;
            }
            else {
                data[key] = value;
            }
        }
    }
    return prisma_2.default.storeSettings.upsert({
        where: { id: "singleton" },
        update: data,
        create: Object.assign({ id: "singleton" }, data),
    });
});
exports.StoreSettingsServices = {
    getSettingsFromDB,
    upsertSettingsIntoDB,
};
