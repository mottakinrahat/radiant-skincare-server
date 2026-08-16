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
exports.fileUploader = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = __importDefault(require("../config"));
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination(req, file, cb) {
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
const endpoint = config_1.default.cloudflare.endpoint ||
    (config_1.default.cloudflare.accountId
        ? `https://${config_1.default.cloudflare.accountId}.r2.cloudflarestorage.com`
        : undefined);
const s3Client = new client_s3_1.S3Client({
    region: config_1.default.cloudflare.region || "auto",
    endpoint: endpoint,
    credentials: {
        accessKeyId: config_1.default.cloudflare.accessKeyId || "",
        secretAccessKey: config_1.default.cloudflare.secretAccessKey || "",
    },
});
/**
 * Builds the public serving URL for an R2 object key using the Cloudflare R2 Public Development / Custom URL.
 * NEVER returns the S3 API endpoint.
 */
const getPublicUrl = (key) => {
    const baseUrl = config_1.default.cloudflare.publicUrl ||
        process.env.CLOUDFLARE_R2_PUBLIC_URL ||
        "https://pub-35b4d3ebcc7e43f3b17d94c945dc95a2.r2.dev";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanKey = key.replace(/^\//, "");
    return `${cleanBase}/${cleanKey}`;
};
/**
 * Uploads a single file to Cloudflare R2 and returns its public URL and object key.
 */
const uploadToCloudflare = (filePath, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const fileName = path_1.default.basename(filePath);
        const folder = (options === null || options === void 0 ? void 0 : options.folder) || "uploads";
        const key = (options === null || options === void 0 ? void 0 : options.customKey) || `${folder}/${fileName}`;
        const contentType = (options === null || options === void 0 ? void 0 : options.mimeType) ||
            mime_types_1.default.lookup(filePath) ||
            "application/octet-stream";
        const bucketName = config_1.default.cloudflare.bucketName || "skincare";
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        });
        yield s3Client.send(command);
        // Clean up local temp file
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Generate public serving URL using CLOUDFLARE_R2_PUBLIC_URL
        const publicUrl = getPublicUrl(key);
        return {
            url: publicUrl,
            key,
        };
    }
    catch (error) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        throw error;
    }
});
/**
 * Uploads multiple files to Cloudflare R2 in parallel and returns array of public URLs and keys.
 */
const uploadMultipleToCloudflare = (files, options) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadPromises = files.map((f) => {
        const filePath = typeof f === "string" ? f : f.path;
        return uploadToCloudflare(filePath, options);
    });
    return Promise.all(uploadPromises);
});
/**
 * Deletes an object from Cloudflare R2 using its key or full public/S3 URL.
 */
const deleteFromCloudflare = (keyOrUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bucketName = config_1.default.cloudflare.bucketName || "skincare";
        let key = keyOrUrl;
        // Extract key if a full URL was provided
        if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
            const urlObj = new URL(keyOrUrl);
            let pathname = urlObj.pathname.replace(/^\//, "");
            // Handle S3 endpoint URL format (endpoint/bucketName/key)
            if (pathname.startsWith(`${bucketName}/`)) {
                pathname = pathname.replace(`${bucketName}/`, "");
            }
            key = pathname;
        }
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        yield s3Client.send(command);
        return true;
    }
    catch (error) {
        console.error("Error deleting file from Cloudflare R2:", error);
        return false;
    }
});
exports.fileUploader = {
    upload,
    getPublicUrl,
    uploadToCloudflare,
    uploadMultipleToCloudflare,
    deleteFromCloudflare,
};
