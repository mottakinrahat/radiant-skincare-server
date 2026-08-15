import multer from "multer";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import config from "../config";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const endpoint =
  config.cloudflare.endpoint ||
  (config.cloudflare.accountId
    ? `https://${config.cloudflare.accountId}.r2.cloudflarestorage.com`
    : undefined);

const s3Client = new S3Client({
  region: config.cloudflare.region || "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: config.cloudflare.accessKeyId || "",
    secretAccessKey: config.cloudflare.secretAccessKey || "",
  },
});

/**
 * Builds the public serving URL for an R2 object key using the Cloudflare R2 Public Development / Custom URL.
 * NEVER returns the S3 API endpoint.
 */
const getPublicUrl = (key: string): string => {
  const baseUrl =
    config.cloudflare.publicUrl ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL ||
    "https://pub-35b4d3ebcc7e43f3b17d94c945dc95a2.r2.dev";

  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanKey = key.replace(/^\//, "");
  return `${cleanBase}/${cleanKey}`;
};

/**
 * Uploads a single file to Cloudflare R2 and returns its public URL and object key.
 */
const uploadToCloudflare = async (
  filePath: string,
  options?: { folder?: string; customKey?: string; mimeType?: string }
): Promise<{ url: string; key: string }> => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const folder = options?.folder || "uploads";
    const key = options?.customKey || `${folder}/${fileName}`;
    const contentType =
      options?.mimeType ||
      mime.lookup(filePath) ||
      "application/octet-stream";

    const bucketName = config.cloudflare.bucketName || "skincare";

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Clean up local temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Generate public serving URL using CLOUDFLARE_R2_PUBLIC_URL
    const publicUrl = getPublicUrl(key);

    return {
      url: publicUrl,
      key,
    };
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Uploads multiple files to Cloudflare R2 in parallel and returns array of public URLs and keys.
 */
const uploadMultipleToCloudflare = async (
  files: (string | Express.Multer.File)[],
  options?: { folder?: string; mimeType?: string }
): Promise<Array<{ url: string; key: string }>> => {
  const uploadPromises = files.map((f) => {
    const filePath = typeof f === "string" ? f : f.path;
    return uploadToCloudflare(filePath, options);
  });
  return Promise.all(uploadPromises);
};

/**
 * Deletes an object from Cloudflare R2 using its key or full public/S3 URL.
 */
const deleteFromCloudflare = async (keyOrUrl: string): Promise<boolean> => {
  try {
    const bucketName = config.cloudflare.bucketName || "skincare";
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

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from Cloudflare R2:", error);
    return false;
  }
};

export const fileUploader = {
  upload,
  getPublicUrl,
  uploadToCloudflare,
  uploadMultipleToCloudflare,
  deleteFromCloudflare,
};
