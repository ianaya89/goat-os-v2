"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckCircle2Icon,
	FileImage,
	Loader2,
	Trash2,
	Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type PaymentReceiptModalProps = NiceModalHocProps & {
	paymentId: string;
	hasReceipt: boolean;
};

export const PaymentReceiptModal = NiceModal.create<PaymentReceiptModalProps>(
	({ paymentId, hasReceipt: initialHasReceipt }) => {
		const t = useTranslations("finance.payments.receipt");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const [hasReceipt, setHasReceipt] = React.useState(initialHasReceipt);
		const [isUploading, setIsUploading] = React.useState(false);
		const [isDragging, setIsDragging] = React.useState(false);
		const [uploadSuccess, setUploadSuccess] = React.useState(false);
		const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
		const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
		const fileInputRef = React.useRef<HTMLInputElement>(null);

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

		// Load preview when receipt exists
		React.useEffect(() => {
			if (hasReceipt && !previewUrl && !isLoadingPreview) {
				setIsLoadingPreview(true);
				fetchDownloadUrl()
					.then((result) => {
						if (result.data?.downloadUrl) {
							setPreviewUrl(result.data.downloadUrl);
						}
					})
					.catch(() => {
						toast.error(t("loadFailed"));
					})
					.finally(() => {
						setIsLoadingPreview(false);
					});
			}
		}, [hasReceipt, previewUrl, isLoadingPreview, fetchDownloadUrl, t]);

		const handleFileSelect = async (file: File): Promise<void> => {
			if (
				!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])
			) {
				toast.error(t("invalidType"));
				return;
			}

			if (file.size > MAX_FILE_SIZE) {
				toast.error(t("fileTooLarge"));
				return;
			}

			setIsUploading(true);

			try {
				const { uploadUrl, key } = await getUploadUrlMutation.mutateAsync({
					paymentId,
					filename: file.name,
					contentType: file.type as (typeof ALLOWED_TYPES)[number],
				});

				const uploadResponse = await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});

				if (!uploadResponse.ok) {
					throw new Error(t("uploadError"));
				}

				await updateReceiptMutation.mutateAsync({
					paymentId,
					receiptImageKey: key,
				});

				toast.success(t("uploadSuccess"));
				setHasReceipt(true);
				setUploadSuccess(true);
				setPreviewUrl(null); // Reset to trigger reload
				utils.organization.trainingPayment.list.invalidate();
				utils.organization.trainingPayment.getSessionPayments.invalidate();
			} catch (error) {
				console.error("Upload error:", error);
				toast.error(t("uploadFailed"));
			} finally {
				setIsUploading(false);
			}
		};

		const handleDelete = async (): Promise<void> => {
			try {
				await deleteReceiptMutation.mutateAsync({ paymentId });
				toast.success(t("deleted"));
				setHasReceipt(false);
				setPreviewUrl(null);
				setUploadSuccess(false);
				utils.organization.trainingPayment.list.invalidate();
				utils.organization.trainingPayment.getSessionPayments.invalidate();
			} catch {
				toast.error(t("deleteFailed"));
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

		const handleInputChange = (
			e: React.ChangeEvent<HTMLInputElement>,
		): void => {
			const file = e.target.files?.[0];
			if (file) {
				handleFileSelect(file);
			}
			e.target.value = "";
		};

		return (
			<Dialog
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<DialogContent
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<DialogHeader>
						<DialogTitle>{t("dialogTitle")}</DialogTitle>
						<DialogDescription>{t("dialogDescription")}</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Upload success feedback */}
						{uploadSuccess && (
							<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
								<CheckCircle2Icon className="size-5 text-green-600" />
								<span className="text-green-700 text-sm dark:text-green-300">
									{t("uploadSuccess")}
								</span>
							</div>
						)}

						{/* Receipt preview */}
						{hasReceipt && (
							<div className="space-y-3">
								{isLoadingPreview && (
									<div className="flex items-center justify-center rounded-lg border bg-muted/30 py-12">
										<Loader2 className="size-6 animate-spin text-muted-foreground" />
									</div>
								)}
								{previewUrl && (
									<div className="overflow-hidden rounded-lg border">
										{previewUrl.includes(".pdf") ? (
											<iframe
												src={previewUrl}
												className="h-[400px] w-full"
												title={t("pdfTitle")}
											/>
										) : (
											<img
												src={previewUrl}
												alt={t("imageAlt")}
												className="mx-auto max-h-[400px] max-w-full"
											/>
										)}
									</div>
								)}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<FileImage className="size-4" />
										<span>{t("hasReceipt")}</span>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={handleDelete}
										disabled={deleteReceiptMutation.isPending}
										className="text-destructive hover:text-destructive"
									>
										{deleteReceiptMutation.isPending ? (
											<Loader2 className="size-4 animate-spin" />
										) : (
											<Trash2 className="mr-1 size-4" />
										)}
										{t("deleted") ? "" : ""}
									</Button>
								</div>
							</div>
						)}

						{/* Upload area */}
						{!hasReceipt && (
							<div
								role="button"
								tabIndex={0}
								className={cn(
									"relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors",
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
								<div className="flex flex-col items-center gap-2 text-muted-foreground">
									{isUploading ? (
										<>
											<Loader2 className="size-8 animate-spin" />
											<span className="text-sm">{t("uploading")}</span>
										</>
									) : (
										<>
											<Upload className="size-8" />
											<span className="text-sm">{t("upload")}</span>
											<span className="text-muted-foreground/60 text-xs">
												JPG, PNG, PDF - Max 10MB
											</span>
										</>
									)}
								</div>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={modal.handleClose}>
							{t("close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
