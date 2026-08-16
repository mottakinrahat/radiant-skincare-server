"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const globalErrorHandler_1 = require("./app/middleWares/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middleWares/notFound"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const corsOptions = {
    origin: (origin, callback) => {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin || "");
        const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
        if (!origin || isLocalhost || vercelPattern.test(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"],
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.options("/{*splat}", (0, cors_1.default)(corsOptions));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Radiant Backend is running with live hot-reload inside Docker" });
});
app.use('/api/v1', routes_1.default);
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
