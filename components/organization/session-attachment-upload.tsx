"use client";

import { FileImage, Loader2, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionAttachmentUploadProps {
	sessionId: string | undefined;
	hasAttachment: boolean;
	onUploadComplete?: () => void;
	disabled?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function SessionAttachmentUpload({
	sessionId,
	hasAttachment,
	onUploadComplete,
	disabled = false,
}: SessionAttachmentUploadProps): React.JSX.Element {
	const [isUploading, setIsUploading] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const [previewOpen, setPreviewOpen] = React.useState(false);
	const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();

	const getUploadUrlMutation =
		trpc.organization.trainingSession.getAttachmentUploadUrl.useMutation();
	const updateAttachmentMutation =
		trpc.organization.trainingSession.updateAttachment.useMutation();
	const deleteAttachmentMutation =
		trpc.organization.trainingSession.deleteAttachment.useMutation();
	const { refetch: fetchDownloadUrl } =
		trpc.organization.trainingSession.getAttachmentDownloadUrl.useQuery(
			{ sessionId: sessionId ?? "" },
			{ enabled: false },
		);

	const handleFileSelect = async (file: File): Promise<void> => {
		if (!sessionId) {
			toast.error("Primero guarda la sesión antes de adjuntar archivos.");
			return;
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
			toast.error("Tipo de archivo no permitido. Use JPG, PNG o PDF.");
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			toast.error("El archivo es muy grande. Máximo 10MB.");
			return;
		}

		setIsUploading(true);

		try {
			// Get pre-signed upload URL
			const { uploadUrl, key } = await getUploadUrlMutation.mutateAsync({
				sessionId,
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

			// Update session with attachment key
			await updateAttachmentMutation.mutateAsync({
				sessionId,
				attachmentKey: key,
			});

			toast.success("Archivo adjunto subido correctamente");
			utils.organization.trainingSession.get.invalidate({ id: sessionId });
			onUploadComplete?.();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Error al subir el archivo");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (): Promise<void> => {
		if (!sessionId) return;

		try {
			await deleteAttachmentMutation.mutateAsync({ sessionId });
			toast.success("Archivo eliminado");
			utils.organization.trainingSession.get.invalidate({ id: sessionId });
			onUploadComplete?.();
		} catch {
			toast.error("Error al eliminar el archivo");
		}
	};

	const handleViewAttachment = async (): Promise<void> => {
		try {
			const result = await fetchDownloadUrl();
			if (result.data?.downloadUrl) {
				setPreviewUrl(result.data.downloadUrl);
				setPreviewOpen(true);
			}
		} catch {
			toast.error("Error al cargar el archivo");
		}
	};

	const handleDragOver = (e: React.DragEvent): void => {
		e.preventDefault();
		if (!disabled && sessionId) {
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

		if (disabled || !sessionId) return;

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
		// Reset input to allow selecting the same file again
		e.target.value = "";
	};

	// If session doesn't exist yet, show disabled state
	if (!sessionId) {
		return (
			<div className="border-2 border-dashed rounded-lg p-3 opacity-50 cursor-not-allowed">
				<div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
					<Upload className="size-4" />
					<span>Guarda la sesión primero</span>
				</div>
			</div>
		);
	}

	if (hasAttachment) {
		return (
			<>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleViewAttachment}
						className="h-8"
					>
						<FileImage className="size-4 mr-1" />
						Ver archivo
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDelete}
						disabled={deleteAttachmentMutation.isPending || disabled}
						className="h-8 text-destructive hover:text-destructive"
					>
						{deleteAttachmentMutation.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Trash2 className="size-4" />
						)}
					</Button>
				</div>

				<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>Archivo Adjunto</DialogTitle>
							<DialogDescription>
								Vista previa del archivo adjunto de la sesión
							</DialogDescription>
						</DialogHeader>
						{previewUrl && (
							<div className="mt-4">
								{previewUrl.includes(".pdf") ? (
									<iframe
										src={previewUrl}
										className="w-full h-[500px] border rounded"
										title="PDF adjunto"
									/>
								) : (
									<img
										src={previewUrl}
										alt="Archivo adjunto"
										className="max-w-full max-h-[500px] mx-auto rounded"
									/>
								)}
							</div>
						)}
					</DialogContent>
				</Dialog>
			</>
		);
	}

	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				className="hidden"
				accept={ALLOWED_TYPES.join(",")}
				onChange={handleInputChange}
				disabled={disabled}
			/>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop zone wrapping interactive button */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					"rounded-lg transition-colors",
					isDragging && "bg-primary/5 ring-2 ring-primary ring-offset-2",
				)}
			>
				<Button
					onClick={() => !disabled && fileInputRef.current?.click()}
					disabled={isUploading || disabled}
					size="sm"
				>
					{isUploading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Upload className="size-4" />
					)}
					{isUploading ? "Subiendo..." : "Subir archivo"}
				</Button>
			</div>
		</>
	);
}
