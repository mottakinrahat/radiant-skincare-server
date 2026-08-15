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
exports.AddressServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = __importDefault(require("../../errors/apiError"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const getUserRecord = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userRecord = yield prisma_1.default.user.findUnique({
        where: { email: user === null || user === void 0 ? void 0 : user.email },
        select: { id: true },
    });
    if (!userRecord) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, "User not found");
    }
    return userRecord;
});
const createAddressIntoDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userRecord = yield getUserRecord(user);
    const userInfoData = {
        line1: (_a = payload.line1) !== null && _a !== void 0 ? _a : payload.addressLine1,
        line2: (_b = payload.line2) !== null && _b !== void 0 ? _b : payload.addressLine2,
        landmark: payload.landmark,
        city: payload.city,
        state: payload.state,
        postalCode: payload.postalCode,
        country: (_c = payload.country) !== null && _c !== void 0 ? _c : "Bangladesh",
    };
    return prisma_1.default.userInfo.upsert({
        where: { userId: userRecord.id },
        create: Object.assign({ userId: userRecord.id }, userInfoData),
        update: userInfoData,
    });
});
const getMyAddressesFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userRecord = yield getUserRecord(user);
    const info = yield prisma_1.default.userInfo.findUnique({
        where: { userId: userRecord.id },
    });
    return info ? [info] : [];
});
const updateMyAddressFromDB = (user, _addressId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return createAddressIntoDB(user, payload);
});
const deleteMyAddressFromDB = (user, _addressId) => __awaiter(void 0, void 0, void 0, function* () {
    const userRecord = yield getUserRecord(user);
    return prisma_1.default.userInfo.update({
        where: { userId: userRecord.id },
        data: {
            line1: null,
            line2: null,
            landmark: null,
            city: null,
            state: null,
            postalCode: null,
        },
    });
});
const setDefaultAddressIntoDB = (user, _addressId) => __awaiter(void 0, void 0, void 0, function* () {
    const userRecord = yield getUserRecord(user);
    return prisma_1.default.userInfo.findUnique({
        where: { userId: userRecord.id },
    });
});
exports.AddressServices = {
    createAddressIntoDB,
    getMyAddressesFromDB,
    updateMyAddressFromDB,
    deleteMyAddressFromDB,
    setDefaultAddressIntoDB,
};
