import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

// ============================================================================
// TYPES
// ============================================================================

export interface UploadOptions {
	contentType?: string;
	expiresIn?: number; // seconds
	metadata?: Record<string, string>;
}

export interface DownloadOptions {
	expiresIn?: number; // seconds
}

export interface UploadResult {
	key: string;
	url: string;
}

// Common MIME types for uploads
export const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
] as const;

export type ImageContentType = (typeof ALLOWED_IMAGE_TYPES)[number];
export type DocumentContentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

// ============================================================================
// BUCKET CONFIGURATION
// ============================================================================

/**
 * Gets the S3 bucket name from environment variables.
 * Uses a single bucket for all storage (images, documents, etc.)
 * with prefixes to organize content.
 */
export function getBucketName(): string {
	const bucket = env.S3_BUCKET || env.NEXT_PUBLIC_IMAGES_BUCKET_NAME;
	if (!bucket) {
		throw new Error("S3_BUCKET environment variable is not configured");
	}
	return bucket;
}

// ============================================================================
// PATH VALIDATION
// ============================================================================

/**
 * Validates and sanitizes a storage path to prevent path traversal attacks.
 * @throws Error if the path is invalid or contains dangerous patterns
 */
function validatePath(path: string): string {
	// Check for path traversal attempts
	if (path.includes("..")) {
		throw new Error("Invalid path: path traversal not allowed");
	}

	// Check for absolute paths
	if (path.startsWith("/")) {
		throw new Error("Invalid path: absolute paths not allowed");
	}

	// Check for null bytes (can be used to bypass validation)
	if (path.includes("\0")) {
		throw new Error("Invalid path: null bytes not allowed");
	}

	// Only allow alphanumeric, hyphens, underscores, forward slashes, and dots
	// This prevents special characters that could be used for injection
	const safePathRegex = /^[a-zA-Z0-9\-_/.]+$/;
	if (!safePathRegex.test(path)) {
		throw new Error(
			"Invalid path: only alphanumeric characters, hyphens, underscores, forward slashes, and dots are allowed",
		);
	}

	// Prevent hidden files (starting with dot)
	if (path.startsWith(".") || path.includes("/.")) {
		throw new Error("Invalid path: hidden files not allowed");
	}

	// Normalize multiple slashes
	const normalizedPath = path.replace(/\/+/g, "/");

	return normalizedPath;
}

// ============================================================================
// S3 CLIENT
// ============================================================================

let s3Client: S3Client | null = null;

/**
 * Resets the S3 client singleton. Call this if configuration changes.
 */
export function resetS3Client(): void {
	s3Client = null;
}

function getS3Client(): S3Client {
	if (!s3Client) {
		const endpoint = env.S3_ENDPOINT;
		const region = env.S3_REGION || "us-east-1";
		const accessKeyId = env.S3_ACCESS_KEY_ID;
		const secretAccessKey = env.S3_SECRET_ACCESS_KEY;

		if (!(accessKeyId && secretAccessKey)) {
			throw new Error(
				"Missing S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY environment variables",
			);
		}

		// Check if using S3-compatible service (MinIO, R2, etc.) or real AWS S3
		const isS3Compatible = endpoint && !endpoint.includes("amazonaws.com");

		const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			// Disable automatic checksum calculation for pre-signed URLs
			// Without this, browser uploads fail because the fetch API doesn't send the checksum headers
			requestChecksumCalculation: "WHEN_REQUIRED",
			responseChecksumValidation: "WHEN_REQUIRED",
		};

		// Only set endpoint and forcePathStyle for S3-compatible services
		if (endpoint) {
			clientConfig.endpoint = endpoint;
			// forcePathStyle is needed for MinIO, R2, and other S3-compatible services
			// but should NOT be used for real AWS S3
			if (isS3Compatible) {
				clientConfig.forcePathStyle = true;
			}
		}

		s3Client = new S3Client(clientConfig);
	}

	return s3Client;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generates a pre-signed URL for uploading a file to S3.
 * The client can use this URL to upload directly to S3 without going through our server.
 */
export async function getSignedUploadUrl(
	path: string,
	bucket: string,
	options: UploadOptions = {},
): Promise<string> {
	const safePath = validatePath(path);
	const s3 = getS3Client();

	const { contentType = "application/octet-stream", expiresIn = 300 } = options;

	try {
		return await getS3SignedUrl(
			s3,
			new PutObjectCommand({
				Bucket: bucket,
				Key: safePath,
				ContentType: contentType,
				Metadata: options.metadata,
			}),
			{
				expiresIn,
				// Prevent checksum headers from being hoisted to query parameters
				// Without this, browser uploads fail because fetch doesn't send matching checksum headers
				unhoistableHeaders: new Set([
					"x-amz-checksum-crc32",
					"x-amz-checksum-crc32c",
					"x-amz-checksum-sha1",
					"x-amz-checksum-sha256",
					"x-amz-sdk-checksum-algorithm",
				]),
			},
		);
	} catch {
		throw new Error("Could not generate signed upload URL");
	}
}

/**
 * Generates a pre-signed URL for downloading/viewing a file from S3.
 */
export async function getSignedUrl(
	path: string,
	bucket: string,
	options: DownloadOptions = {},
): Promise<string> {
	const safePath = validatePath(path);
	const s3 = getS3Client();

	const { expiresIn = 3600 } = options; // Default 1 hour

	try {
		return await getS3SignedUrl(
			s3,
			new GetObjectCommand({
				Bucket: bucket,
				Key: safePath,
			}),
			{ expiresIn },
		);
	} catch {
		throw new Error("Could not generate signed download URL");
	}
}

/**
 * Deletes an object from S3.
 */
export async function deleteObject(
	path: string,
	bucket: string,
): Promise<void> {
	const safePath = validatePath(path);
	const s3 = getS3Client();

	try {
		await s3.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: safePath,
			}),
		);
	} catch {
		throw new Error("Could not delete object from S3");
	}
}

/**
 * Checks if an object exists in S3.
 */
export async function objectExists(
	path: string,
	bucket: string,
): Promise<boolean> {
	const safePath = validatePath(path);
	const s3 = getS3Client();

	try {
		await s3.send(
			new HeadObjectCommand({
				Bucket: bucket,
				Key: safePath,
			}),
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Generates a unique key for storing a file.
 * Format: {prefix}/{organizationId}/{year}/{month}/{uuid}.{extension}
 */
export function generateStorageKey(
	prefix: string,
	organizationId: string,
	filename: string,
): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const uuid = crypto.randomUUID();
	const extension = filename.split(".").pop()?.toLowerCase() || "bin";

	return `${prefix}/${organizationId}/${year}/${month}/${uuid}.${extension}`;
}

/**
 * Gets the content type from a filename.
 */
export function getContentTypeFromFilename(filename: string): string {
	const extension = filename.split(".").pop()?.toLowerCase();

	const contentTypes: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
		pdf: "application/pdf",
		doc: "application/msword",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	};

	return contentTypes[extension || ""] || "application/octet-stream";
}

/**
 * Validates that a content type is allowed for images.
 */
export function isAllowedImageType(
	contentType: string,
): contentType is ImageContentType {
	return ALLOWED_IMAGE_TYPES.includes(contentType as ImageContentType);
}

/**
 * Validates that a content type is allowed for documents (receipts).
 */
export function isAllowedDocumentType(
	contentType: string,
): contentType is DocumentContentType {
	return ALLOWED_DOCUMENT_TYPES.includes(contentType as DocumentContentType);
}

/**
 * Gets the public URL for a stored object.
 * Note: This assumes the bucket has public read access or you're using CloudFront.
 */
export function getPublicUrl(path: string, bucket: string): string {
	const safePath = validatePath(path);
	const endpoint = env.S3_ENDPOINT;

	if (!endpoint) {
		throw new Error("S3_ENDPOINT not configured");
	}

	// For S3-compatible services, construct the URL
	return `${endpoint}/${bucket}/${safePath}`;
}
