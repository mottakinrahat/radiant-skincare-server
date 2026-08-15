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
exports.ManagerServices = void 0;
const prisma_1 = require("../../../../prisma/generated/prisma");
const prisma_2 = __importDefault(require("../../../shared/prisma"));
const manager_constants_1 = require("./manager.constants");
const paginationHelpers_1 = require("../../../helpers/paginationHelpers");
const apiError_1 = __importDefault(require("../../errors/apiError"));
const http_status_1 = __importDefault(require("http-status"));
const getAllFromDB = (filters, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelpers_1.paginationHelpers.calculatePagination(options);
    const { searchTerm } = filters, filterData = __rest(filters, ["searchTerm"]);
    const andConditions = [
        { role: prisma_1.UserRole.MANAGER },
        { isDeleted: false },
    ];
    if (searchTerm) {
        andConditions.push({
            OR: manager_constants_1.managerSearchableFields.map((field) => ({
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
            orderBy: sortBy && sortOrder ? [{ [sortBy]: sortOrder }] : [{ name: "asc" }],
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                contactNumber: true,
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
const getByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_2.default.user.findFirst({
        where: { id, role: prisma_1.UserRole.MANAGER },
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            contactNumber: true,
            status: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            userInfo: true,
        },
    });
    if (!result)
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, "Manager not found");
    return result;
});
const updateIntoDB = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield getByIdFromDB(id);
    return prisma_2.default.user.update({
        where: { id },
        data,
        select: {
            id: true, email: true, role: true, name: true,
            contactNumber: true, status: true, updatedAt: true, userInfo: true,
        },
    });
});
const deleteFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield getByIdFromDB(id);
    return prisma_2.default.user.delete({ where: { id } });
});
const softDeleteFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield getByIdFromDB(id);
    return prisma_2.default.user.update({
        where: { id },
        data: { isDeleted: true, status: prisma_1.UserStatus.BLOCKED },
    });
});
exports.ManagerServices = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    deleteFromDB,
    softDeleteFromDB,
};
