"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../prisma/generated/prisma");
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new prisma_1.PrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
exports.default = prisma;
