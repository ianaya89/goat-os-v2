"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
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
	PlusIcon,
	ShieldCheckIcon,
	TrashIcon,
	UploadIcon,
	XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
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

interface AthleteMyMedicalTabProps {
	hasMedicalCertificate: boolean;
	medicalCertificateUploadedAt: Date | null;
	medicalCertificateExpiresAt: Date | null;
}

const documentTypeLabels: Record<AthleteMedicalDocumentType, string> = {
	[AthleteMedicalDocumentType.bloodTest]: "Análisis de sangre",
	[AthleteMedicalDocumentType.cardiacStudy]: "Estudio cardíaco",
	[AthleteMedicalDocumentType.xRay]: "Rayos X",
	[AthleteMedicalDocumentType.mri]: "Resonancia magnética",
	[AthleteMedicalDocumentType.ultrasound]: "Ecografía",
	[AthleteMedicalDocumentType.physicalExam]: "Examen físico",
	[AthleteMedicalDocumentType.injuryReport]: "Informe de lesión",
	[AthleteMedicalDocumentType.surgeryReport]: "Informe de cirugía",
	[AthleteMedicalDocumentType.rehabilitation]: "Rehabilitación",
	[AthleteMedicalDocumentType.vaccination]: "Vacunación",
	[AthleteMedicalDocumentType.allergy]: "Alergia",
	[AthleteMedicalDocumentType.other]: "Otro",
};

export function AthleteMyMedicalTab({
	hasMedicalCertificate: initialHasCertificate,
	medicalCertificateUploadedAt: initialCertUploadedAt,
	medicalCertificateExpiresAt: initialCertExpiresAt,
}: AthleteMyMedicalTabProps) {
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

	// Queries - using athlete self-service endpoints
	const documentsQuery = trpc.athlete.listMyMedicalDocuments.useQuery({});

	const certificateUrlQuery = trpc.athlete.getMyCertificateUrl.useQuery(
		undefined,
		{ enabled: initialHasCertificate },
	);

	// Mutations - using athlete self-service endpoints
	const getUploadUrlMutation = trpc.athlete.getMyMedicalUploadUrl.useMutation();
	const uploadCertificateMutation =
		trpc.athlete.uploadMyCertificate.useMutation({
			onSuccess: () => {
				toast.success("Certificado médico subido correctamente");
				utils.athlete.getMyProfile.invalidate();
				certificateUrlQuery.refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Error al subir el certificado");
			},
		});

	const removeCertificateMutation =
		trpc.athlete.removeMyCertificate.useMutation({
			onSuccess: () => {
				toast.success("Certificado médico eliminado");
				utils.athlete.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar el certificado");
			},
		});

	const createDocumentMutation =
		trpc.athlete.createMyMedicalDocument.useMutation({
			onSuccess: () => {
				toast.success("Documento médico agregado correctamente");
				documentsQuery.refetch();
				setIsAddDocumentOpen(false);
				resetDocumentForm();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar el documento");
			},
		});

	const deleteDocumentMutation =
		trpc.athlete.deleteMyMedicalDocument.useMutation({
			onSuccess: () => {
				toast.success("Documento eliminado");
				documentsQuery.refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar el documento");
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
			// Get presigned upload URL
			const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
				fileName: file.name,
				contentType: file.type,
				isCertificate: true,
			});

			// Upload to S3
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

			// Save to database
			await uploadCertificateMutation.mutateAsync({
				fileKey,
			});
		} catch (_error) {
			toast.error("Error al subir el certificado");
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
			toast.error("Por favor completa todos los campos requeridos");
			return;
		}

		setIsUploadingDocument(true);
		try {
			// Get presigned upload URL
			const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
				fileName: documentFile.name,
				contentType: documentFile.type,
				isCertificate: false,
			});

			// Upload to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: documentFile,
				headers: {
					"Content-Type": documentFile.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Error al subir el archivo");
			}

			// Create document record
			await createDocumentMutation.mutateAsync({
				documentType: selectedDocumentType,
				title: documentTitle.trim(),
				description: documentDescription.trim() || undefined,
				fileKey,
				fileName: documentFile.name,
				fileSize: documentFile.size,
				mimeType: documentFile.type,
			});
		} catch (_error) {
			toast.error("Error al agregar el documento");
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
			30 * 24 * 60 * 60 * 1000; // 30 days

	return (
		<div className="space-y-6">
			{/* Medical Certificate Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<ShieldCheckIcon className="size-5 text-primary" />
							<CardTitle>Certificado de Aptitud Física</CardTitle>
						</div>
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
										Vencido
									</>
								) : isCertificateExpiringSoon ? (
									<>
										<AlertCircleIcon className="mr-1 size-3" />
										Por vencer
									</>
								) : (
									<>
										<CheckCircle2Icon className="mr-1 size-3" />
										Vigente
									</>
								)}
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="border-gray-300 bg-gray-50 text-gray-600"
							>
								<XCircleIcon className="mr-1 size-3" />
								No disponible
							</Badge>
						)}
					</div>
					<CardDescription>
						Documento que certifica tu aptitud física para la práctica deportiva
					</CardDescription>
				</CardHeader>
				<CardContent>
					{initialHasCertificate ? (
						<div className="space-y-4">
							{isCertificateExpired && (
								<Alert variant="destructive">
									<AlertCircleIcon className="size-4" />
									<AlertDescription>
										Tu certificado ha vencido. Por favor sube un nuevo
										certificado.
									</AlertDescription>
								</Alert>
							)}

							{isCertificateExpiringSoon && (
								<Alert>
									<AlertCircleIcon className="size-4" />
									<AlertDescription>
										Tu certificado vencerá pronto. Considera renovarlo.
									</AlertDescription>
								</Alert>
							)}

							<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
										<FileTextIcon className="size-6 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											Certificado médico de aptitud física
										</p>
										<div className="flex items-center gap-4 text-muted-foreground text-sm">
											{initialCertUploadedAt && (
												<span className="flex items-center gap-1">
													<CalendarIcon className="size-3" />
													Subido:{" "}
													{format(
														new Date(initialCertUploadedAt),
														"d MMM yyyy",
														{ locale: es },
													)}
												</span>
											)}
											{initialCertExpiresAt && (
												<span className="flex items-center gap-1">
													<CalendarIcon className="size-3" />
													Vence:{" "}
													{format(
														new Date(initialCertExpiresAt),
														"d MMM yyyy",
														{ locale: es },
													)}
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
											Ver
										</Button>
									)}
									<Button
										variant="outline"
										size="sm"
										onClick={() => removeCertificateMutation.mutate()}
										disabled={removeCertificateMutation.isPending}
									>
										{removeCertificateMutation.isPending ? (
											<Loader2Icon className="size-4 animate-spin" />
										) : (
											<TrashIcon className="size-4 text-destructive" />
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
											Subiendo...
										</>
									) : (
										<>
											<UploadIcon className="mr-2 size-4" />
											Reemplazar certificado
										</>
									)}
								</Button>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-8">
							<div className="flex size-16 items-center justify-center rounded-full bg-muted">
								<HeartPulseIcon className="size-8 text-muted-foreground" />
							</div>
							<p className="mt-4 text-muted-foreground">
								No tienes un certificado de aptitud física registrado
							</p>
							<input
								ref={certificateInputRef}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png"
								className="hidden"
								onChange={handleCertificateUpload}
							/>
							<Button
								className="mt-4"
								onClick={() => certificateInputRef.current?.click()}
								disabled={isUploadingCertificate}
							>
								{isUploadingCertificate ? (
									<>
										<Loader2Icon className="mr-2 size-4 animate-spin" />
										Subiendo...
									</>
								) : (
									<>
										<UploadIcon className="mr-2 size-4" />
										Subir certificado
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Other Medical Documents Section */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2">
								<FileIcon className="size-5 text-primary" />
								<CardTitle>Estudios Médicos</CardTitle>
							</div>
							<CardDescription className="mt-1">
								Tus estudios médicos y documentación
							</CardDescription>
						</div>
						<Button size="sm" onClick={() => setIsAddDocumentOpen(true)}>
							<PlusIcon className="mr-2 size-4" />
							Agregar
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{documentsQuery.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : documentsQuery.data?.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8">
							<div className="flex size-16 items-center justify-center rounded-full bg-muted">
								<FileIcon className="size-8 text-muted-foreground" />
							</div>
							<p className="mt-4 text-muted-foreground">
								No tienes estudios médicos registrados
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{documentsQuery.data?.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center gap-4">
										<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
											<FileTextIcon className="size-5 text-primary" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<p className="font-medium">{doc.title}</p>
												<Badge variant="secondary">
													{
														documentTypeLabels[
															doc.documentType as AthleteMedicalDocumentType
														]
													}
												</Badge>
											</div>
											<div className="flex items-center gap-4 text-muted-foreground text-sm">
												<span className="flex items-center gap-1">
													<CalendarIcon className="size-3" />
													{format(new Date(doc.createdAt), "d MMM yyyy", {
														locale: es,
													})}
												</span>
												{doc.uploadedByUser && (
													<span className="flex items-center gap-1">
														<UserAvatar
															className="size-4"
															name={doc.uploadedByUser.name ?? ""}
															src={doc.uploadedByUser.image ?? undefined}
														/>
														{doc.uploadedByUser.name}
													</span>
												)}
											</div>
											{doc.description && (
												<p className="mt-1 text-muted-foreground text-sm">
													{doc.description}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										{doc.signedUrl && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => window.open(doc.signedUrl!, "_blank")}
											>
												<DownloadIcon className="mr-2 size-4" />
												Ver
											</Button>
										)}
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												deleteDocumentMutation.mutate({ id: doc.id })
											}
											disabled={deleteDocumentMutation.isPending}
										>
											{deleteDocumentMutation.isPending ? (
												<Loader2Icon className="size-4 animate-spin" />
											) : (
												<TrashIcon className="size-4 text-destructive" />
											)}
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Add Document Dialog */}
			<Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar estudio médico</DialogTitle>
						<DialogDescription>
							Sube un nuevo documento médico a tu perfil
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<Field>
							<FieldLabel>Tipo de documento *</FieldLabel>
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
									{Object.entries(documentTypeLabels).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field>
							<FieldLabel>Título *</FieldLabel>
							<Input
								value={documentTitle}
								onChange={(e) => setDocumentTitle(e.target.value)}
								placeholder="Ej: Análisis de sangre - Enero 2024"
							/>
						</Field>

						<Field>
							<FieldLabel>Descripción (opcional)</FieldLabel>
							<Textarea
								value={documentDescription}
								onChange={(e) => setDocumentDescription(e.target.value)}
								placeholder="Notas adicionales sobre el documento..."
								rows={3}
							/>
						</Field>

						<Field>
							<FieldLabel>Archivo *</FieldLabel>
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
										<span>Haz clic para seleccionar un archivo</span>
										<span className="text-xs">
											PDF, JPG, PNG, DOC (máx. 10MB)
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
							Cancelar
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
									Subiendo...
								</>
							) : (
								<>
									<UploadIcon className="mr-2 size-4" />
									Subir documento
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
