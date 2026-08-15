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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const bcrypt = __importStar(require("bcrypt"));
const n8n_services_1 = require("../../middleWares/n8n.services");
const fileUploader_1 = require("../../../helpers/fileUploader");
const user_constant_1 = require("./user.constant");
const prisma_1 = require("../../../../prisma/generated/prisma");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const apiError_1 = __importDefault(require("../../errors/apiError"));
const http_status_1 = __importDefault(require("http-status"));
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const ensureEmailIsAvailable = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield prisma_2.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new apiError_1.default(http_status_1.default.CONFLICT, "This email already exists. Please login.");
    }
});
const createUserWithRole = (req, role) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const file = req.file;
    let profilePhotoUrl = req.body.profilePhoto || ((_a = req.body.userInfo) === null || _a === void 0 ? void 0 : _a.profilePhoto);
    if (file) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudflare(file === null || file === void 0 ? void 0 : file.path);
        profilePhotoUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.url;
    }
    const { email, password, name, contactNumber, userInfo } = req.body;
    yield ensureEmailIsAvailable(email);
    const hashedPassword = yield bcrypt.hash(password, 12);
    const result = yield prisma_2.default.user.create({
        data: Object.assign({ email, password: hashedPassword, role,
            name,
            contactNumber, needPasswordChange: role === prisma_1.UserRole.ADMIN || role === prisma_1.UserRole.MANAGER }, (profilePhotoUrl || userInfo
            ? {
                userInfo: {
                    create: {
                        profilePhoto: profilePhotoUrl,
                        bio: userInfo === null || userInfo === void 0 ? void 0 : userInfo.bio,
                        line1: (_b = userInfo === null || userInfo === void 0 ? void 0 : userInfo.line1) !== null && _b !== void 0 ? _b : userInfo === null || userInfo === void 0 ? void 0 : userInfo.addressLine1,
                        line2: (_c = userInfo === null || userInfo === void 0 ? void 0 : userInfo.line2) !== null && _c !== void 0 ? _c : userInfo === null || userInfo === void 0 ? void 0 : userInfo.addressLine2,
                        landmark: userInfo === null || userInfo === void 0 ? void 0 : userInfo.landmark,
                        city: userInfo === null || userInfo === void 0 ? void 0 : userInfo.city,
                        state: userInfo === null || userInfo === void 0 ? void 0 : userInfo.state,
                        postalCode: userInfo === null || userInfo === void 0 ? void 0 : userInfo.postalCode,
                        country: (_d = userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) !== null && _d !== void 0 ? _d : "Bangladesh",
                    },
                },
            }
            : {})),
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            contactNumber: true,
            status: true,
            createdAt: true,
            userInfo: true,
        },
    });
    (0, n8n_services_1.triggerN8NWebhook)("user-registered", { name: result.name, email, role });
    return result;
});
const createAdmin = (req) => createUserWithRole(req, prisma_1.UserRole.ADMIN);
const createManagerIntoDB = (req) => createUserWithRole(req, prisma_1.UserRole.MANAGER);
const createBuyerIntoDB = (req) => createUserWithRole(req, prisma_1.UserRole.BUYER);
const getAllUserFromDB = (params, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, sortBy, sortOrder, skip } = paginationHelpers_1.paginationHelpers.calculatePagination(options);
    const { searchTerm } = params, filterData = __rest(params, ["searchTerm"]);
    const andConditions = [{ isDeleted: false }];
    if (searchTerm) {
        andConditions.push({
            OR: user_constant_1.userSearchableFields.map((field) => ({
                [field]: { contains: searchTerm, mode: "insensitive" },
            })),
        });
    }
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: { equals: filterData[key] },
            })),
        });
    }
    const whereConditions = { AND: andConditions };
    const [result, total] = yield prisma_2.default.$transaction([
        prisma_2.default.user.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: sortBy && sortOrder ? [{ [sortBy]: sortOrder }] : [{ createdAt: "asc" }],
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                contactNumber: true,
                needPasswordChange: true,
                status: true,
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
                userInfo: true,
            },
        }),
        prisma_2.default.user.count({ where: whereConditions }),
    ]);
    return { meta: { page, limit, total }, data: result };
});
const changeProfileStatus = (id, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_2.default.user.findUniqueOrThrow({ where: { id } });
    return prisma_2.default.user.update({ where: { id }, data: { status: newStatus } });
});
const getMyProfile = (user) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_2.default.user.findUnique({
        where: { email: user.email },
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            contactNumber: true,
            status: true,
            needPasswordChange: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            userInfo: true,
        },
    });
});
const updateMyProfile = (user, req) => __awaiter(void 0, void 0, void 0, function* () {
    const userRecord = yield prisma_2.default.user.findUnique({
        where: { email: user === null || user === void 0 ? void 0 : user.email, status: prisma_1.UserStatus.ACTIVE },
        select: { id: true },
    });
    if (!userRecord)
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    const file = req.file;
    let profilePhotoUrl = req.body.profilePhoto;
    if (file) {
        const uploaded = yield fileUploader_1.fileUploader.uploadToCloudflare(file === null || file === void 0 ? void 0 : file.path);
        profilePhotoUrl = uploaded === null || uploaded === void 0 ? void 0 : uploaded.url;
    }
    const { name, contactNumber, userInfo } = req.body;
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (contactNumber !== undefined)
        updateData.contactNumber = contactNumber;
    const userInfoData = {};
    if (profilePhotoUrl !== undefined)
        userInfoData.profilePhoto = profilePhotoUrl;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.bio) !== undefined)
        userInfoData.bio = userInfo.bio;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.line1) !== undefined)
        userInfoData.line1 = userInfo.line1;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.line2) !== undefined)
        userInfoData.line2 = userInfo.line2;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.landmark) !== undefined)
        userInfoData.landmark = userInfo.landmark;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.city) !== undefined)
        userInfoData.city = userInfo.city;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.state) !== undefined)
        userInfoData.state = userInfo.state;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.postalCode) !== undefined)
        userInfoData.postalCode = userInfo.postalCode;
    if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.country) !== undefined)
        userInfoData.country = userInfo.country;
    if (Object.keys(userInfoData).length > 0) {
        updateData.userInfo = {
            upsert: {
                create: userInfoData,
                update: userInfoData,
            },
        };
    }
    return prisma_2.default.user.update({
        where: { id: userRecord.id },
        data: updateData,
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            contactNumber: true,
            status: true,
            updatedAt: true,
            userInfo: true,
        },
    });
});
exports.UserServices = {
    createAdmin,
    createManagerIntoDB,
    createBuyerIntoDB,
    getAllUserFromDB,
    changeProfileStatus,
    getMyProfile,
    updateMyProfile,
};
