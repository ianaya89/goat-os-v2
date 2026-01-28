"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckCircle2Icon, Loader2, Trash2Icon, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ---------------------------------------------------------------------------
// Shared receipt operations interface
// ---------------------------------------------------------------------------

interface ReceiptOperations {
	getUploadUrl: (params: {
		filename: string;
		contentType: string;
	}) => Promise<{ uploadUrl: string; key: string }>;
	updateReceipt: (receiptImageKey: string) => Promise<void>;
	deleteReceipt: () => Promise<void>;
	getDownloadUrl: () => Promise<string | undefined>;
	invalidateCache: () => void;
}

// ---------------------------------------------------------------------------
// Shared modal UI
// ---------------------------------------------------------------------------

interface ReceiptModalContentProps {
	initialHasReceipt: boolean;
	translationNamespace: string;
	operations: ReceiptOperations;
}

function ReceiptModalContent({
	initialHasReceipt,
	translationNamespace,
	operations,
}: ReceiptModalContentProps): React.JSX.Element {
	const t = useTranslations(translationNamespace);
	const modal = useEnhancedModal();

	const [hasReceipt, setHasReceipt] = React.useState(initialHasReceipt);
	const [isUploading, setIsUploading] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [isDragging, setIsDragging] = React.useState(false);
	const [uploadSuccess, setUploadSuccess] = React.useState(false);
	const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
	const [isLoadingPreview, setIsLoadingPreview] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	// Load preview when receipt exists
	React.useEffect(() => {
		if (hasReceipt && !previewUrl && !isLoadingPreview) {
			setIsLoadingPreview(true);
			operations
				.getDownloadUrl()
				.then((url) => {
					if (url) {
						setPreviewUrl(url);
					}
				})
				.catch(() => {
					toast.error(t("loadFailed"));
				})
				.finally(() => {
					setIsLoadingPreview(false);
				});
		}
	}, [hasReceipt, previewUrl, isLoadingPreview, operations, t]);

	const handleFileSelect = async (file: File): Promise<void> => {
		if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
			toast.error(t("invalidType"));
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			toast.error(t("fileTooLarge"));
			return;
		}

		setIsUploading(true);

		try {
			const { uploadUrl, key } = await operations.getUploadUrl({
				filename: file.name,
				contentType: file.type,
			});

			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});

			if (!uploadResponse.ok) {
				throw new Error(t("uploadError"));
			}

			await operations.updateReceipt(key);

			toast.success(t("uploadSuccess"));
			setHasReceipt(true);
			setUploadSuccess(true);
			setPreviewUrl(null);
			operations.invalidateCache();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(t("uploadFailed"));
		} finally {
			setIsUploading(false);
		}
	};

	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		try {
			await operations.deleteReceipt();
			toast.success(t("deleted"));
			setHasReceipt(false);
			setPreviewUrl(null);
			setUploadSuccess(false);
			operations.invalidateCache();
		} catch {
			toast.error(t("deleteFailed"));
		} finally {
			setIsDeleting(false);
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

					{/* Receipt preview with overlay delete */}
					{hasReceipt && (
						<div className="relative overflow-hidden rounded-lg border">
							{isLoadingPreview && (
								<div className="flex items-center justify-center bg-muted/30 py-12">
									<Loader2 className="size-6 animate-spin text-muted-foreground" />
								</div>
							)}
							{previewUrl && (
								<>
									{previewUrl.includes(".pdf") ? (
										<iframe
											src={`${previewUrl}#toolbar=0&navpanes=0`}
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
								</>
							)}
							{/* Delete overlay button */}
							<button
								type="button"
								onClick={handleDelete}
								disabled={isDeleting}
								className={cn(
									"absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive",
									isDeleting && "pointer-events-none opacity-50",
								)}
							>
								{isDeleting ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Trash2Icon className="size-4" />
								)}
							</button>
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
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// Training Payment Receipt Modal
// ---------------------------------------------------------------------------

export type PaymentReceiptModalProps = NiceModalHocProps & {
	paymentId: string;
	hasReceipt: boolean;
};

export const PaymentReceiptModal = NiceModal.create<PaymentReceiptModalProps>(
	({ paymentId, hasReceipt }) => {
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

		const operations = React.useMemo<ReceiptOperations>(
			() => ({
				getUploadUrl: async (params) => {
					return getUploadUrlMutation.mutateAsync({
						paymentId,
						filename: params.filename,
						contentType: params.contentType as (typeof ALLOWED_TYPES)[number],
					});
				},
				updateReceipt: async (receiptImageKey) => {
					await updateReceiptMutation.mutateAsync({
						paymentId,
						receiptImageKey,
					});
				},
				deleteReceipt: async () => {
					await deleteReceiptMutation.mutateAsync({ paymentId });
				},
				getDownloadUrl: async () => {
					const result = await fetchDownloadUrl();
					return result.data?.downloadUrl;
				},
				invalidateCache: () => {
					utils.organization.trainingPayment.invalidate();
				},
			}),
			[
				paymentId,
				getUploadUrlMutation,
				updateReceiptMutation,
				deleteReceiptMutation,
				fetchDownloadUrl,
				utils,
			],
		);

		return (
			<ReceiptModalContent
				initialHasReceipt={hasReceipt}
				translationNamespace="finance.payments.receipt"
				operations={operations}
			/>
		);
	},
);

// ---------------------------------------------------------------------------
// Expense Receipt Modal
// ---------------------------------------------------------------------------

export type ExpenseReceiptModalProps = NiceModalHocProps & {
	expenseId: string;
	hasReceipt: boolean;
};

export const ExpenseReceiptModal = NiceModal.create<ExpenseReceiptModalProps>(
	({ expenseId, hasReceipt }) => {
		const utils = trpc.useUtils();

		const getUploadUrlMutation =
			trpc.organization.expense.getReceiptUploadUrl.useMutation();
		const updateReceiptMutation =
			trpc.organization.expense.updateExpenseReceipt.useMutation();
		const deleteReceiptMutation =
			trpc.organization.expense.deleteExpenseReceipt.useMutation();
		const { refetch: fetchDownloadUrl } =
			trpc.organization.expense.getReceiptDownloadUrl.useQuery(
				{ expenseId },
				{ enabled: false },
			);

		const operations = React.useMemo<ReceiptOperations>(
			() => ({
				getUploadUrl: async (params) => {
					return getUploadUrlMutation.mutateAsync({
						expenseId,
						filename: params.filename,
						contentType: params.contentType as (typeof ALLOWED_TYPES)[number],
					});
				},
				updateReceipt: async (receiptImageKey) => {
					await updateReceiptMutation.mutateAsync({
						expenseId,
						receiptImageKey,
					});
				},
				deleteReceipt: async () => {
					await deleteReceiptMutation.mutateAsync({ expenseId });
				},
				getDownloadUrl: async () => {
					const result = await fetchDownloadUrl();
					return result.data?.downloadUrl;
				},
				invalidateCache: () => {
					utils.organization.expense.invalidate();
				},
			}),
			[
				expenseId,
				getUploadUrlMutation,
				updateReceiptMutation,
				deleteReceiptMutation,
				fetchDownloadUrl,
				utils,
			],
		);

		return (
			<ReceiptModalContent
				initialHasReceipt={hasReceipt}
				translationNamespace="finance.expenses.receipt"
				operations={operations}
			/>
		);
	},
);

// ---------------------------------------------------------------------------
// Event Payment Receipt Modal
// ---------------------------------------------------------------------------

export type EventPaymentReceiptModalProps = NiceModalHocProps & {
	paymentId: string;
	hasReceipt: boolean;
};

export const EventPaymentReceiptModal =
	NiceModal.create<EventPaymentReceiptModalProps>(
		({ paymentId, hasReceipt }) => {
			const utils = trpc.useUtils();

			const getUploadUrlMutation =
				trpc.organization.sportsEvent.getReceiptUploadUrl.useMutation();
			const updateReceiptMutation =
				trpc.organization.sportsEvent.updatePaymentReceipt.useMutation();
			const deleteReceiptMutation =
				trpc.organization.sportsEvent.deletePaymentReceipt.useMutation();
			const { refetch: fetchDownloadUrl } =
				trpc.organization.sportsEvent.getReceiptDownloadUrl.useQuery(
					{ paymentId },
					{ enabled: false },
				);

			const operations = React.useMemo<ReceiptOperations>(
				() => ({
					getUploadUrl: async (params) => {
						return getUploadUrlMutation.mutateAsync({
							paymentId,
							filename: params.filename,
							contentType: params.contentType as (typeof ALLOWED_TYPES)[number],
						});
					},
					updateReceipt: async (receiptImageKey) => {
						await updateReceiptMutation.mutateAsync({
							paymentId,
							receiptImageKey,
						});
					},
					deleteReceipt: async () => {
						await deleteReceiptMutation.mutateAsync({ paymentId });
					},
					getDownloadUrl: async () => {
						const result = await fetchDownloadUrl();
						return result.data?.downloadUrl;
					},
					invalidateCache: () => {
						utils.organization.sportsEvent.listPayments.invalidate();
					},
				}),
				[
					paymentId,
					getUploadUrlMutation,
					updateReceiptMutation,
					deleteReceiptMutation,
					fetchDownloadUrl,
					utils,
				],
			);

			return (
				<ReceiptModalContent
					initialHasReceipt={hasReceipt}
					translationNamespace="finance.eventPayments.receipt"
					operations={operations}
				/>
			);
		},
	);
