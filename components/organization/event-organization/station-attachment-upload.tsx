"use client";

import {
	ExternalLink,
	type File,
	Loader2,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface StationAttachment {
	key: string;
	name: string;
	type: string;
}

interface StationAttachmentUploadProps {
	stationId: string | undefined;
	attachments: StationAttachment[];
	onAttachmentsChange: (attachments: StationAttachment[]) => void;
	disabled?: boolean;
}

const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function StationAttachmentUpload({
	stationId,
	attachments,
	onAttachmentsChange,
	disabled = false,
}: StationAttachmentUploadProps): React.JSX.Element {
	const [isUploading, setIsUploading] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const getUploadUrlMutation =
		trpc.organization.eventRotation.getStationAttachmentUploadUrl.useMutation();

	const { refetch: fetchDownloadUrl } =
		trpc.organization.eventRotation.getStationAttachmentDownloadUrl.useQuery(
			{ stationId: stationId ?? "", attachmentKey: "" },
			{ enabled: false },
		);

	const handleFileSelect = async (file: File): Promise<void> => {
		if (!stationId) {
			toast.error(
				"Primero guarda la estaci\u00f3n antes de adjuntar archivos.",
			);
			return;
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
			toast.error(
				"Tipo de archivo no permitido. Use im\u00e1genes, PDF o Word.",
			);
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			toast.error("El archivo es muy grande. M\u00e1ximo 10MB.");
			return;
		}

		setIsUploading(true);

		try {
			// Get pre-signed upload URL
			const { uploadUrl, key } = await getUploadUrlMutation.mutateAsync({
				stationId,
				filename: file.name,
				contentType: file.type as (typeof ALLOWED_TYPES)[number],
			});

			// Upload directly to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Error al subir el archivo");
			}

			// Add to attachments list
			const newAttachment: StationAttachment = {
				key,
				name: file.name,
				type: file.type,
			};

			onAttachmentsChange([...attachments, newAttachment]);
			toast.success("Archivo subido correctamente");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Error al subir el archivo");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = (index: number): void => {
		const newAttachments = attachments.filter((_, i) => i !== index);
		onAttachmentsChange(newAttachments);
	};

	const _handleView = async (attachment: StationAttachment): Promise<void> => {
		if (!stationId) return;

		try {
			// We need to manually construct the query for download URL
			const _result = await fetchDownloadUrl();
			// For now, just open the key as URL - in production this should be signed
			// This is a simplification - ideally we'd fetch the signed URL
			window.open(attachment.key, "_blank");
		} catch {
			toast.error("Error al abrir el archivo");
		}
	};

	const handleDragOver = (e: React.DragEvent): void => {
		e.preventDefault();
		if (!disabled && stationId) {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (e: React.DragEvent): void => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent): void => {
		e.preventDefault();
		setIsDragging(false);

		if (disabled || !stationId) return;

		const file = e.dataTransfer.files[0];
		if (file) {
			handleFileSelect(file);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
		e.target.value = "";
	};

	const getFileIcon = (type: string) => {
		if (type.startsWith("image/")) {
			return "🖼️";
		}
		if (type === "application/pdf") {
			return "📄";
		}
		return "📎";
	};

	return (
		<div className="space-y-3">
			{/* Existing attachments */}
			{attachments.length > 0 && (
				<div className="space-y-2">
					{attachments.map((attachment, index) => (
						<div
							key={attachment.key}
							className="flex items-center gap-2 rounded-md border p-2 text-sm"
						>
							<span className="text-base">{getFileIcon(attachment.type)}</span>
							<span className="flex-1 truncate">{attachment.name}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => handleDelete(index)}
							>
								<X className="size-3" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Upload area */}
			{!stationId ? (
				<div className="border-2 border-dashed rounded-lg p-3 opacity-50 cursor-not-allowed">
					<div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
						<Upload className="size-4" />
						<span>Guarda la estaci\u00f3n primero para adjuntar archivos</span>
					</div>
				</div>
			) : (
				<div
					role="button"
					tabIndex={disabled ? -1 : 0}
					className={cn(
						"relative border-2 border-dashed rounded-lg p-3 transition-colors cursor-pointer",
						isDragging
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25 hover:border-muted-foreground/50",
						(isUploading || disabled) && "pointer-events-none opacity-50",
					)}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => !disabled && fileInputRef.current?.click()}
					onKeyDown={(e) => {
						if ((e.key === "Enter" || e.key === " ") && !disabled) {
							e.preventDefault();
							fileInputRef.current?.click();
						}
					}}
				>
					<input
						ref={fileInputRef}
						type="file"
						className="hidden"
						accept={ALLOWED_TYPES.join(",")}
						onChange={handleInputChange}
						disabled={disabled}
					/>
					<div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
						{isUploading ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								<span>Subiendo...</span>
							</>
						) : (
							<>
								<Upload className="size-4" />
								<span>Arrastra o haz clic para adjuntar archivos</span>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
