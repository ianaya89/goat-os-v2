"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarIcon,
	ExternalLinkIcon,
	GlobeIcon,
	ImageIcon,
	PlusIcon,
	SparklesIcon,
	UploadIcon,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { CropImageModal } from "@/components/crop-image-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";
import "cropperjs/dist/cropper.css";

// Partnership types
const partnershipTypes = [
	{ value: "equipment", label: "Equipamiento" },
	{ value: "apparel", label: "Indumentaria" },
	{ value: "nutrition", label: "Nutricion" },
	{ value: "financial", label: "Financiero" },
	{ value: "other", label: "Otro" },
] as const;

// Form schema
const sponsorFormSchema = z.object({
	name: z.string().min(2, "El nombre es requerido").max(100),
	website: z.string().url("URL invalida").optional().or(z.literal("")),
	description: z.string().max(300).optional(),
	partnershipType: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	isPublic: z.boolean(),
});

type SponsorFormValues = z.infer<typeof sponsorFormSchema>;

interface Sponsor {
	id: string;
	name: string;
	logoKey: string | null;
	logoUrl: string | null;
	website: string | null;
	description: string | null;
	partnershipType: string | null;
	startDate: string | null;
	endDate: string | null;
	isPublic: boolean;
	displayOrder: number;
}

interface SponsorModalProps {
	sponsor?: Sponsor;
}

// Modal for add/edit sponsor
const SponsorModal = NiceModal.create(({ sponsor }: SponsorModalProps) => {
	const modal = useEnhancedModal();
	const utils = trpc.useUtils();
	const isEditing = !!sponsor;
	const [logoFile, setLogoFile] = React.useState<File | null>(null);
	const [logoPreview, setLogoPreview] = React.useState<string | null>(
		sponsor?.logoUrl ?? null,
	);
	const [uploadingLogo, setUploadingLogo] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const form = useZodForm({
		schema: sponsorFormSchema,
		defaultValues: {
			name: sponsor?.name ?? "",
			website: sponsor?.website ?? "",
			description: sponsor?.description ?? "",
			partnershipType: sponsor?.partnershipType ?? "",
			startDate: sponsor?.startDate
				? new Date(sponsor.startDate).toISOString().split("T")[0]
				: "",
			endDate: sponsor?.endDate
				? new Date(sponsor.endDate).toISOString().split("T")[0]
				: "",
			isPublic: sponsor?.isPublic ?? true,
		},
	});

	const getUploadUrlMutation =
		trpc.athlete.getSponsorLogoUploadUrl.useMutation();

	const addMutation = trpc.athlete.addSponsor.useMutation({
		onSuccess: () => {
			utils.athlete.listMySponsors.invalidate();
			toast.success("Sponsor agregado");
			modal.handleClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateMutation = trpc.athlete.updateSponsor.useMutation({
		onSuccess: () => {
			utils.athlete.listMySponsors.invalidate();
			toast.success("Sponsor actualizado");
			modal.handleClose();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Solo se permiten imagenes");
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast.error("La imagen no puede superar 5MB");
				return;
			}
			NiceModal.show(CropImageModal, {
				image: file,
				onCrop: (croppedBlob: Blob | null) => {
					if (croppedBlob) {
						const croppedFile = new File([croppedBlob], file.name, {
							type: "image/png",
						});
						setLogoFile(croppedFile);
						setLogoPreview(URL.createObjectURL(croppedBlob));
					}
				},
			});
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const uploadLogo = async (): Promise<string | null> => {
		if (!logoFile) return sponsor?.logoKey ?? null;

		try {
			setUploadingLogo(true);
			const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
				fileName: logoFile.name,
				contentType: logoFile.type,
			});

			const response = await fetch(uploadUrl, {
				method: "PUT",
				body: logoFile,
				headers: {
					"Content-Type": logoFile.type,
				},
			});

			if (!response.ok) {
				throw new Error("Error al subir el logo");
			}

			return fileKey;
		} catch {
			toast.error("Error al subir el logo");
			throw new Error("Upload failed");
		} finally {
			setUploadingLogo(false);
		}
	};

	const onSubmit = form.handleSubmit(async (values: SponsorFormValues) => {
		try {
			const logoKey = await uploadLogo();

			const data = {
				name: values.name,
				website: values.website || null,
				description: values.description || null,
				partnershipType: values.partnershipType || null,
				startDate: values.startDate ? new Date(values.startDate) : null,
				endDate: values.endDate ? new Date(values.endDate) : null,
				isPublic: values.isPublic,
				logoKey,
			};

			if (isEditing && sponsor) {
				updateMutation.mutate({ id: sponsor.id, ...data });
			} else {
				addMutation.mutate(data);
			}
		} catch {
			// Error already handled
		}
	});

	const isPending =
		addMutation.isPending || updateMutation.isPending || uploadingLogo;

	return (
		<ProfileEditSheet
			open={modal.visible}
			onClose={modal.handleClose}
			title={isEditing ? "Editar Sponsor" : "Agregar Sponsor"}
			subtitle="Muestra tus patrocinadores y partnerships en tu perfil publico"
			icon={<SparklesIcon className="size-5" />}
			accentColor="amber"
			form={form}
			onSubmit={onSubmit}
			isPending={isPending}
			submitLabel={
				uploadingLogo ? "Subiendo logo..." : isEditing ? "Guardar" : "Agregar"
			}
			maxWidth="lg"
			onAnimationEndCapture={modal.handleAnimationEndCapture}
		>
			<div className="space-y-6">
				{/* Logo Upload */}
				<ProfileEditSection title="Logo del sponsor">
					<div className="flex items-center gap-4">
						<div
							role="button"
							tabIndex={0}
							className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 transition-all hover:border-amber-400 hover:bg-amber-100/50 dark:border-amber-700 dark:bg-amber-950/30 dark:hover:border-amber-600"
							onClick={() => fileInputRef.current?.click()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									fileInputRef.current?.click();
								}
							}}
						>
							{logoPreview ? (
								<Image
									src={logoPreview}
									alt="Logo preview"
									fill
									className="object-cover"
								/>
							) : (
								<ImageIcon className="size-10 text-amber-400" />
							)}
						</div>
						<div className="flex-1">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
							>
								<UploadIcon className="mr-2 size-4" />
								{logoPreview ? "Cambiar logo" : "Subir logo"}
							</Button>
							<p className="mt-1 text-muted-foreground text-xs">
								PNG, JPG o WebP. Se recortara a formato cuadrado.
							</p>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							className="hidden"
						/>
					</div>
				</ProfileEditSection>

				<ProfileEditSection title="Informacion del sponsor">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>Nombre del Sponsor *</FormLabel>
									<FormControl>
										<Input placeholder="Nike, Adidas, Gatorade..." {...field} />
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="website"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>Sitio Web</FormLabel>
									<FormControl>
										<Input placeholder="https://www.ejemplo.com" {...field} />
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>Descripcion</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Breve descripcion de la asociacion..."
											className="resize-none"
											rows={2}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="partnershipType"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>Tipo de Partnership</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona un tipo" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{partnershipTypes.map((type) => (
												<SelectItem key={type.value} value={type.value}>
													{type.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>
				</ProfileEditSection>

				<ProfileEditSection title="Duracion del partnership">
					<ProfileEditGrid cols={2}>
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Fecha de Inicio</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Fecha de Fin</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormDescription>Dejar vacio si es vigente</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditGrid>
				</ProfileEditSection>

				<ProfileEditSection>
					<FormField
						control={form.control}
						name="isPublic"
						render={({ field }) => (
							<FormItem className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
								<div className="space-y-0.5">
									<FormLabel className="text-amber-800 dark:text-amber-300">
										Mostrar en perfil publico
									</FormLabel>
									<FormDescription>
										Si esta desactivado, solo tu veras este sponsor.
									</FormDescription>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</ProfileEditSection>
			</div>
		</ProfileEditSheet>
	);
});

export function AthleteSponsorsTab() {
	const { data: sponsors, isLoading } = trpc.athlete.listMySponsors.useQuery();
	const utils = trpc.useUtils();

	const deleteMutation = trpc.athlete.deleteSponsor.useMutation({
		onSuccess: () => {
			utils.athlete.listMySponsors.invalidate();
			toast.success("Sponsor eliminado");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleAdd = () => {
		NiceModal.show(SponsorModal);
	};

	const handleEdit = (sponsor: Sponsor) => {
		NiceModal.show(SponsorModal, { sponsor });
	};

	const handleDelete = (id: string) => {
		if (confirm("Eliminar este sponsor?")) {
			deleteMutation.mutate({ id });
		}
	};

	const getPartnershipLabel = (type: string | null) => {
		if (!type) return null;
		return partnershipTypes.find((t) => t.value === type)?.label ?? type;
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="py-10">
					<div className="flex items-center justify-center">
						<div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<SparklesIcon className="size-5" />
						Sponsors y Partnerships
					</CardTitle>
					<Button size="sm" onClick={handleAdd}>
						<PlusIcon className="mr-2 size-4" />
						Agregar
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{!sponsors || sponsors.length === 0 ? (
					<div className="py-10 text-center">
						<SparklesIcon className="mx-auto size-12 text-muted-foreground/50" />
						<h3 className="mt-4 font-semibold">Sin sponsors</h3>
						<p className="mt-2 max-w-sm mx-auto text-muted-foreground text-sm">
							Agrega tus patrocinadores y partnerships para mostrarlos en tu
							perfil publico.
						</p>
						<Button className="mt-4" size="sm" onClick={handleAdd}>
							<PlusIcon className="mr-2 size-4" />
							Agregar
						</Button>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{sponsors.map((sponsor) => (
							<div
								key={sponsor.id}
								className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
							>
								{/* Actions */}
								<div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEdit(sponsor as Sponsor)}
									>
										Editar
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => handleDelete(sponsor.id)}
										disabled={deleteMutation.isPending}
									>
										Eliminar
									</Button>
								</div>

								{/* Logo */}
								<div className="mb-3 flex items-center justify-center">
									{sponsor.logoUrl ? (
										<div className="relative size-16">
											<Image
												src={sponsor.logoUrl}
												alt={sponsor.name}
												fill
												className="object-contain"
											/>
										</div>
									) : (
										<div className="flex size-16 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
											<SparklesIcon className="size-8 text-amber-500" />
										</div>
									)}
								</div>

								{/* Name */}
								<h4 className="text-center font-semibold">{sponsor.name}</h4>

								{/* Type badge */}
								{sponsor.partnershipType && (
									<div className="mt-2 flex justify-center">
										<Badge
											variant="secondary"
											className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
										>
											{getPartnershipLabel(sponsor.partnershipType)}
										</Badge>
									</div>
								)}

								{/* Description */}
								{sponsor.description && (
									<p className="mt-2 text-center text-muted-foreground text-xs line-clamp-2">
										{sponsor.description}
									</p>
								)}

								{/* Dates */}
								{(sponsor.startDate || sponsor.endDate) && (
									<div className="mt-2 flex items-center justify-center gap-1 text-muted-foreground text-xs">
										<CalendarIcon className="size-3" />
										<span>
											{sponsor.startDate
												? format(new Date(sponsor.startDate), "MMM yyyy")
												: "?"}
											{" — "}
											{sponsor.endDate
												? format(new Date(sponsor.endDate), "MMM yyyy")
												: "Presente"}
										</span>
									</div>
								)}

								{/* Website link */}
								{sponsor.website && (
									<div className="mt-3 flex justify-center">
										<a
											href={sponsor.website}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-amber-600 text-xs hover:underline dark:text-amber-400"
										>
											<GlobeIcon className="size-3" />
											Visitar sitio
											<ExternalLinkIcon className="size-3" />
										</a>
									</div>
								)}

								{/* Private badge */}
								{!sponsor.isPublic && (
									<div className="mt-2 flex justify-center">
										<Badge variant="outline" className="text-xs">
											Privado
										</Badge>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
