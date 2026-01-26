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

interface TrainingPaymentReceiptUploadProps {
	paymentId: string;
	hasReceipt: boolean;
	onUploadComplete?: () => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function TrainingPaymentReceiptUpload({
	paymentId,
	hasReceipt,
	onUploadComplete,
}: TrainingPaymentReceiptUploadProps): React.JSX.Element {
	const [isUploading, setIsUploading] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const [previewOpen, setPreviewOpen] = React.useState(false);
	const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();

	const getUploadUrlMutation =
		trpc.organization.trainingPayment.getReceiptUploadUrl.useMutation();
	const updateReceiptMutation =
		trpc.organization.trainingPayment.updatePaymentReceipt.useMutation();
	const deleteReceiptMutation =
		trpc.organization.trainingPayment.deletePaymentReceipt.useMutation();
	const { refetch: fetchDownloadUrl } =
		trpc.organization.trainingPayment.getReceiptDownloadUrl.useQuery(
			{ paymentId },
			{ enabled: false },
		);

	const handleFileSelect = async (file: File): Promise<void> => {
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
				paymentId,
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

			// Update payment with receipt key
			await updateReceiptMutation.mutateAsync({
				paymentId,
				receiptImageKey: key,
			});

			toast.success("Comprobante subido correctamente");
			utils.organization.trainingPayment.list.invalidate();
			onUploadComplete?.();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Error al subir el comprobante");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (): Promise<void> => {
		try {
			await deleteReceiptMutation.mutateAsync({ paymentId });
			toast.success("Comprobante eliminado");
			utils.organization.trainingPayment.list.invalidate();
			onUploadComplete?.();
		} catch {
			toast.error("Error al eliminar el comprobante");
		}
	};

	const handleViewReceipt = async (): Promise<void> => {
		try {
			const result = await fetchDownloadUrl();
			if (result.data?.downloadUrl) {
				setPreviewUrl(result.data.downloadUrl);
				setPreviewOpen(true);
			}
		} catch {
			toast.error("Error al cargar el comprobante");
		}
	};

	const handleDragOver = (e: React.DragEvent): void => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent): void => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent): void => {
		e.preventDefault();
		setIsDragging(false);

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

	if (hasReceipt) {
		return (
			<>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleViewReceipt}
						className="h-8"
					>
						<FileImage className="size-4 mr-1" />
						Ver
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDelete}
						disabled={deleteReceiptMutation.isPending}
						className="h-8 text-destructive hover:text-destructive"
					>
						{deleteReceiptMutation.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Trash2 className="size-4" />
						)}
					</Button>
				</div>

				<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
					<DialogContent className="max-w-3xl">
						<DialogHeader>
							<DialogTitle>Comprobante de Pago</DialogTitle>
							<DialogDescription>
								Vista previa del comprobante subido
							</DialogDescription>
						</DialogHeader>
						{previewUrl && (
							<div className="mt-4">
								{previewUrl.includes(".pdf") ? (
									<iframe
										src={previewUrl}
										className="w-full h-[500px] border rounded"
										title="Comprobante PDF"
									/>
								) : (
									<img
										src={previewUrl}
										alt="Comprobante de pago"
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
		<div
			role="button"
			tabIndex={0}
			className={cn(
				"relative border-2 border-dashed rounded-lg p-3 transition-colors cursor-pointer",
				isDragging
					? "border-primary bg-primary/5"
					: "border-muted-foreground/25 hover:border-muted-foreground/50",
				isUploading && "pointer-events-none opacity-50",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={() => fileInputRef.current?.click()}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
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
						<span>Subir comprobante</span>
					</>
				)}
			</div>
		</div>
	);
}
