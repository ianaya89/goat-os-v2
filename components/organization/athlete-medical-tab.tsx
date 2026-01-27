"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	AlertCircleIcon,
	CalendarIcon,
	CheckCircle2Icon,
	DownloadIcon,
	ExternalLinkIcon,
	FileIcon,
	FileTextIcon,
	HeartPulseIcon,
	Loader2Icon,
	MoreHorizontalIcon,
	PlusIcon,
	ShieldCheckIcon,
	Trash2Icon,
	UploadIcon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { AthleteMedicalDocumentType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AthleteMedicalTabProps {
	athleteId: string;
	hasMedicalCertificate: boolean;
	medicalCertificateUploadedAt: Date | null;
	medicalCertificateExpiresAt: Date | null;
}

export function AthleteMedicalTab({
	athleteId,
	hasMedicalCertificate: initialHasCertificate,
	medicalCertificateUploadedAt: initialCertUploadedAt,
	medicalCertificateExpiresAt: initialCertExpiresAt,
}: AthleteMedicalTabProps) {
	const t = useTranslations("athletes.medical");
	const utils = trpc.useUtils();
	const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
	const [isUploadingDocument, setIsUploadingDocument] = useState(false);
	const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
	const [selectedDocumentType, setSelectedDocumentType] =
		useState<AthleteMedicalDocumentType>(AthleteMedicalDocumentType.other);
	const [documentTitle, setDocumentTitle] = useState("");
	const [documentDescription, setDocumentDescription] = useState("");
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const certificateInputRef = useRef<HTMLInputElement>(null);
	const documentInputRef = useRef<HTMLInputElement>(null);

	// Queries
	const documentsQuery =
		trpc.organization.athleteMedical.listDocuments.useQuery({
			athleteId,
		});

	const certificateUrlQuery =
		trpc.organization.athleteMedical.getCertificateUrl.useQuery(
			{ athleteId },
			{ enabled: initialHasCertificate },
		);

	// Mutations
	const getUploadUrlMutation =
		trpc.organization.athleteMedical.getUploadUrl.useMutation();
	const uploadCertificateMutation =
		trpc.organization.athleteMedical.uploadCertificate.useMutation({
			onSuccess: () => {
				toast.success(t("certificate.uploadSuccess"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				certificateUrlQuery.refetch();
			},
			onError: (error) => {
				toast.error(error.message || t("certificate.uploadError"));
			},
		});

	const removeCertificateMutation =
		trpc.organization.athleteMedical.removeCertificate.useMutation({
			onSuccess: () => {
				toast.success(t("certificate.deleteSuccess"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
			},
			onError: (error) => {
				toast.error(error.message || t("certificate.deleteError"));
			},
		});

	const createDocumentMutation =
		trpc.organization.athleteMedical.createDocument.useMutation({
			onSuccess: () => {
				toast.success(t("documents.createSuccess"));
				documentsQuery.refetch();
				setIsAddDocumentOpen(false);
				resetDocumentForm();
			},
			onError: (error) => {
				toast.error(error.message || t("documents.createError"));
			},
		});

	const deleteDocumentMutation =
		trpc.organization.athleteMedical.deleteDocument.useMutation({
			onSuccess: () => {
				toast.success(t("documents.deleteSuccess"));
				documentsQuery.refetch();
			},
			onError: (error) => {
				toast.error(error.message || t("documents.deleteError"));
			},
		});

	const resetDocumentForm = () => {
		setSelectedDocumentType(AthleteMedicalDocumentType.other);
		setDocumentTitle("");
		setDocumentDescription("");
		setDocumentFile(null);
	};

	// Certificate Upload Handler
	const handleCertificateUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsUploadingCertificate(true);
		try {
			const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
				athleteId,
				fileName: file.name,
				contentType: file.type,
				isCertificate: true,
			});

			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});

			if (!uploadResponse.ok) {
				throw new Error(t("certificate.uploadError"));
			}

			await uploadCertificateMutation.mutateAsync({
				athleteId,
				fileKey,
			});
		} catch (_error) {
			toast.error(t("certificate.uploadError"));
		} finally {
			setIsUploadingCertificate(false);
			if (certificateInputRef.current) {
				certificateInputRef.current.value = "";
			}
		}
	};

	// Document Upload Handler
	const handleDocumentUpload = async () => {
		if (!documentFile || !documentTitle.trim()) {
			toast.error(t("documents.requiredFields"));
			return;
		}

		setIsUploadingDocument(true);
		try {
			const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
				athleteId,
				fileName: documentFile.name,
				contentType: documentFile.type,
				isCertificate: false,
			});

			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: documentFile,
				headers: { "Content-Type": documentFile.type },
			});

			if (!uploadResponse.ok) {
				throw new Error(t("documents.uploadError"));
			}

			await createDocumentMutation.mutateAsync({
				athleteId,
				documentType: selectedDocumentType,
				title: documentTitle.trim(),
				description: documentDescription.trim() || undefined,
				fileKey,
				fileName: documentFile.name,
				fileSize: documentFile.size,
				mimeType: documentFile.type,
			});
		} catch (_error) {
			toast.error(t("documents.uploadError"));
		} finally {
			setIsUploadingDocument(false);
		}
	};

	const isCertificateExpired =
		initialCertExpiresAt && new Date(initialCertExpiresAt) < new Date();
	const isCertificateExpiringSoon =
		initialCertExpiresAt &&
		!isCertificateExpired &&
		new Date(initialCertExpiresAt).getTime() - Date.now() <
			30 * 24 * 60 * 60 * 1000;

	return (
		<div className="space-y-6">
			{/* Medical Certificate Section */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<ShieldCheckIcon className="size-4" />
						{t("certificate.title")}
					</CardTitle>
					{initialHasCertificate ? (
						<Badge
							variant="outline"
							className={cn(
								isCertificateExpired
									? "border-red-500 bg-red-50 text-red-700"
									: isCertificateExpiringSoon
										? "border-yellow-500 bg-yellow-50 text-yellow-700"
										: "border-green-500 bg-green-50 text-green-700",
							)}
						>
							{isCertificateExpired ? (
								<>
									<XCircleIcon className="mr-1 size-3" />
									{t("certificate.status.expired")}
								</>
							) : isCertificateExpiringSoon ? (
								<>
									<AlertCircleIcon className="mr-1 size-3" />
									{t("certificate.status.expiringSoon")}
								</>
							) : (
								<>
									<CheckCircle2Icon className="mr-1 size-3" />
									{t("certificate.status.valid")}
								</>
							)}
						</Badge>
					) : (
						<Badge
							variant="outline"
							className="border-gray-300 bg-gray-50 text-gray-600"
						>
							<XCircleIcon className="mr-1 size-3" />
							{t("certificate.status.notAvailable")}
						</Badge>
					)}
				</CardHeader>
				<CardContent>
					{initialHasCertificate ? (
						<div className="space-y-4">
							{isCertificateExpired && (
								<Alert variant="destructive">
									<AlertCircleIcon className="size-4" />
									<AlertDescription>
										{t("certificate.alerts.expired")}
									</AlertDescription>
								</Alert>
							)}

							{isCertificateExpiringSoon && (
								<Alert>
									<AlertCircleIcon className="size-4" />
									<AlertDescription>
										{t("certificate.alerts.expiringSoon")}
									</AlertDescription>
								</Alert>
							)}

							<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<FileTextIcon className="size-6 text-primary" />
									</div>
									<div>
										<p className="font-medium">{t("certificate.fileName")}</p>
										<div className="flex items-center gap-4 text-muted-foreground text-sm">
											{initialCertUploadedAt && (
												<span className="flex items-center gap-1">
													<CalendarIcon className="size-3" />
													{t("certificate.uploaded")}:{" "}
													{format(
														new Date(initialCertUploadedAt),
														"d MMM yyyy",
													)}
												</span>
											)}
											{initialCertExpiresAt && (
												<span className="flex items-center gap-1">
													<CalendarIcon className="size-3" />
													{t("certificate.expires")}:{" "}
													{format(new Date(initialCertExpiresAt), "d MMM yyyy")}
												</span>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{certificateUrlQuery.data?.signedUrl && (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												window.open(
													certificateUrlQuery.data.signedUrl!,
													"_blank",
												)
											}
										>
											<ExternalLinkIcon className="mr-2 size-4" />
											{t("certificate.view")}
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											removeCertificateMutation.mutate({ athleteId })
										}
										disabled={removeCertificateMutation.isPending}
									>
										{removeCertificateMutation.isPending ? (
											<Loader2Icon className="size-4 animate-spin" />
										) : (
											<Trash2Icon className="size-4 text-destructive" />
										)}
									</Button>
								</div>
							</div>

							<div className="flex justify-center">
								<input
									ref={certificateInputRef}
									type="file"
									accept=".pdf,.jpg,.jpeg,.png"
									className="hidden"
									onChange={handleCertificateUpload}
								/>
								<Button
									variant="outline"
									onClick={() => certificateInputRef.current?.click()}
									disabled={isUploadingCertificate}
								>
									{isUploadingCertificate ? (
										<>
											<Loader2Icon className="mr-2 size-4 animate-spin" />
											{t("certificate.uploading")}
										</>
									) : (
										<>
											<UploadIcon className="mr-2 size-4" />
											{t("certificate.replace")}
										</>
									)}
								</Button>
							</div>
						</div>
					) : (
						<>
							<input
								ref={certificateInputRef}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png"
								className="hidden"
								onChange={handleCertificateUpload}
							/>
							<EmptyState
								icon={HeartPulseIcon}
								title={t("certificate.noCertificate")}
								size="sm"
								action={
									<Button
										size="sm"
										onClick={() => certificateInputRef.current?.click()}
										disabled={isUploadingCertificate}
									>
										{isUploadingCertificate ? (
											<>
												<Loader2Icon className="mr-2 size-4 animate-spin" />
												{t("certificate.uploading")}
											</>
										) : (
											<>
												<UploadIcon className="mr-2 size-4" />
												{t("certificate.upload")}
											</>
										)}
									</Button>
								}
							/>
						</>
					)}
				</CardContent>
			</Card>

			{/* Medical Documents Section */}
			<div className="space-y-4">
				<div className="flex justify-end">
					<Button size="sm" onClick={() => setIsAddDocumentOpen(true)}>
						<PlusIcon className="mr-1 size-4" />
						{t("documents.addDocument")}
					</Button>
				</div>

				{documentsQuery.isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : !documentsQuery.data || documentsQuery.data.length === 0 ? (
					<EmptyState icon={FileIcon} title={t("documents.noDocuments")} />
				) : (
					<div className="rounded-lg border">
						<table className="w-full">
							<thead>
								<tr className="border-b bg-muted/50">
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										{t("documents.table.title")}
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										{t("documents.table.type")}
									</th>
									<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
										{t("documents.table.date")}
									</th>
									<th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
										{t("documents.table.uploadedBy")}
									</th>
									<th className="w-[50px] px-4 py-3 text-right text-xs font-medium text-muted-foreground">
										<span className="sr-only">
											{t("documents.table.actions")}
										</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{documentsQuery.data.map((doc) => (
									<tr key={doc.id} className="hover:bg-muted/30">
										<td className="px-4 py-3">
											<div>
												<span className="font-medium text-sm">{doc.title}</span>
												{doc.description && (
													<p className="max-w-[250px] truncate text-muted-foreground text-xs">
														{doc.description}
													</p>
												)}
											</div>
										</td>
										<td className="px-4 py-3">
											<Badge variant="secondary">
												{t(
													`documents.types.${doc.documentType as AthleteMedicalDocumentType}`,
												)}
											</Badge>
										</td>
										<td className="hidden px-4 py-3 text-sm md:table-cell">
											{format(new Date(doc.createdAt), "dd MMM yyyy")}
										</td>
										<td className="hidden px-4 py-3 md:table-cell">
											{doc.uploadedByUser ? (
												<span className="flex items-center gap-1.5 text-sm">
													<UserAvatar
														className="size-5"
														name={doc.uploadedByUser.name ?? ""}
														src={doc.uploadedByUser.image ?? undefined}
													/>
													{doc.uploadedByUser.name}
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</td>
										<td className="px-4 py-3">
											<div className="flex justify-end">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															className="size-8 text-muted-foreground data-[state=open]:bg-muted"
															size="icon"
															variant="ghost"
														>
															<MoreHorizontalIcon className="shrink-0" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														{doc.signedUrl && (
															<DropdownMenuItem
																onClick={() =>
																	window.open(doc.signedUrl!, "_blank")
																}
															>
																<DownloadIcon className="mr-2 size-4" />
																{t("documents.actions.view")}
															</DropdownMenuItem>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															variant="destructive"
															onClick={() => {
																NiceModal.show(ConfirmationModal, {
																	title: t("documents.deleteConfirm.title"),
																	message: t(
																		"documents.deleteConfirm.message",
																		{ name: doc.title },
																	),
																	confirmLabel: t(
																		"documents.deleteConfirm.confirm",
																	),
																	destructive: true,
																	onConfirm: () => {
																		deleteDocumentMutation.mutate({
																			id: doc.id,
																		});
																	},
																});
															}}
														>
															<Trash2Icon className="mr-2 size-4" />
															{t("documents.actions.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Add Document Dialog */}
			<Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("documents.addDialogTitle")}</DialogTitle>
						<DialogDescription>
							{t("documents.addDialogDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<Field>
							<FieldLabel>{t("documents.documentType")} *</FieldLabel>
							<Select
								value={selectedDocumentType}
								onValueChange={(v) =>
									setSelectedDocumentType(v as AthleteMedicalDocumentType)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.values(AthleteMedicalDocumentType).map((type) => (
										<SelectItem key={type} value={type}>
											{t(`documents.types.${type}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field>
							<FieldLabel>{t("documents.documentTitle")} *</FieldLabel>
							<Input
								value={documentTitle}
								onChange={(e) => setDocumentTitle(e.target.value)}
								placeholder={t("documents.documentTitlePlaceholder")}
							/>
						</Field>

						<Field>
							<FieldLabel>{t("documents.documentDescription")}</FieldLabel>
							<Textarea
								value={documentDescription}
								onChange={(e) => setDocumentDescription(e.target.value)}
								placeholder={t("documents.documentDescriptionPlaceholder")}
								rows={3}
							/>
						</Field>

						<Field>
							<FieldLabel>{t("documents.file")} *</FieldLabel>
							<input
								ref={documentInputRef}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
								className="hidden"
								onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
							/>
							<div
								role="button"
								tabIndex={0}
								className={cn(
									"flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
									documentFile
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25 hover:border-primary/50",
								)}
								onClick={() => documentInputRef.current?.click()}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										documentInputRef.current?.click();
									}
								}}
							>
								{documentFile ? (
									<div className="flex items-center gap-2">
										<FileTextIcon className="size-5 text-primary" />
										<span className="font-medium">{documentFile.name}</span>
										<span className="text-muted-foreground text-sm">
											({(documentFile.size / 1024).toFixed(1)} KB)
										</span>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<UploadIcon className="size-8" />
										<span>{t("documents.fileSelect")}</span>
										<span className="text-xs">
											{t("documents.fileFormats")}
										</span>
									</div>
								)}
							</div>
						</Field>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsAddDocumentOpen(false)}
						>
							{t("documents.cancel")}
						</Button>
						<Button
							onClick={handleDocumentUpload}
							disabled={
								isUploadingDocument || !documentFile || !documentTitle.trim()
							}
						>
							{isUploadingDocument ? (
								<>
									<Loader2Icon className="mr-2 size-4 animate-spin" />
									{t("documents.uploading")}
								</>
							) : (
								<>
									<UploadIcon className="mr-2 size-4" />
									{t("documents.uploadDocument")}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
