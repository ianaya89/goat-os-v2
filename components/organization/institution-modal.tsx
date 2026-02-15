"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	BriefcaseIcon,
	CheckIcon,
	FlagIcon,
	Loader2Icon,
	PlusIcon,
	Trash2Icon,
	UploadIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { COUNTRIES } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

// Unified schema with discriminated union
const clubSchema = z.object({
	type: z.literal("club"),
	name: z.string().trim().min(1, "El nombre es requerido").max(200),
	shortName: z.string().trim().max(50).optional(),
	country: z.string().trim().max(100).optional(),
	city: z.string().trim().max(100).optional(),
	website: z
		.string()
		.trim()
		.url("URL inválida")
		.max(500)
		.optional()
		.or(z.literal("")),
	notes: z.string().trim().max(1000).optional(),
});

const nationalTeamSchema = z.object({
	type: z.literal("nationalTeam"),
	name: z.string().trim().min(1, "El nombre es requerido").max(200),
	country: z.string().trim().min(1, "El país es requerido").max(100),
	category: z.string().trim().max(100).optional(),
	notes: z.string().trim().max(1000).optional(),
});

const institutionSchema = z.discriminatedUnion("type", [
	clubSchema,
	nationalTeamSchema,
]);

type InstitutionFormData = z.infer<typeof institutionSchema>;

interface InstitutionData {
	id: string;
	type: "club" | "nationalTeam";
	name: string;
	country: string | null;
	city: string | null;
	category: string | null;
	shortName: string | null;
	website: string | null;
	notes: string | null;
	logoKey: string | null;
}

const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

interface InstitutionModalProps {
	institution?: InstitutionData;
	defaultType?: "club" | "nationalTeam";
}

export const InstitutionModal = NiceModal.create<InstitutionModalProps>(
	({ institution, defaultType = "club" }) => {
		const t = useTranslations("institutions");
		const tCommon = useTranslations("common");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!institution;

		const initialType = institution?.type ?? defaultType;

		const form = useZodForm({
			schema: institutionSchema,
			defaultValues: isEditing
				? institution.type === "club"
					? {
							type: "club" as const,
							name: institution.name,
							shortName: institution.shortName ?? "",
							country: institution.country ?? "",
							city: institution.city ?? "",
							website: institution.website ?? "",
							notes: institution.notes ?? "",
						}
					: {
							type: "nationalTeam" as const,
							name: institution.name,
							country: institution.country ?? "",
							category: institution.category ?? "",
							notes: institution.notes ?? "",
						}
				: initialType === "club"
					? {
							type: "club" as const,
							name: "",
							shortName: "",
							country: "",
							city: "",
							website: "",
							notes: "",
						}
					: {
							type: "nationalTeam" as const,
							name: "",
							country: "",
							category: "",
							notes: "",
						},
		});

		const currentType = form.watch("type");

		// Logo upload state
		const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
		const [isUploadingLogo, setIsUploadingLogo] = React.useState(false);
		const [isDeletingLogo, setIsDeletingLogo] = React.useState(false);
		const [hasLogo, setHasLogo] = React.useState(!!institution?.logoKey);
		const logoInputRef = React.useRef<HTMLInputElement>(null);

		// Logo mutations - Club
		const getClubLogoUploadUrlMutation =
			trpc.organization.institution.getClubLogoUploadUrl.useMutation();
		const updateClubLogoMutation =
			trpc.organization.institution.updateClubLogo.useMutation();
		const deleteClubLogoMutation =
			trpc.organization.institution.deleteClubLogo.useMutation();
		const { refetch: fetchClubLogoUrl } =
			trpc.organization.institution.getClubLogoDownloadUrl.useQuery(
				{ clubId: institution?.id ?? "" },
				{ enabled: false },
			);

		// Logo mutations - National Team
		const getNationalTeamLogoUploadUrlMutation =
			trpc.organization.institution.getNationalTeamLogoUploadUrl.useMutation();
		const updateNationalTeamLogoMutation =
			trpc.organization.institution.updateNationalTeamLogo.useMutation();
		const deleteNationalTeamLogoMutation =
			trpc.organization.institution.deleteNationalTeamLogo.useMutation();
		const { refetch: fetchNationalTeamLogoUrl } =
			trpc.organization.institution.getNationalTeamLogoDownloadUrl.useQuery(
				{ nationalTeamId: institution?.id ?? "" },
				{ enabled: false },
			);

		// Load logo URL when editing
		React.useEffect(() => {
			if (isEditing && institution.logoKey && !logoUrl) {
				if (institution.type === "club") {
					fetchClubLogoUrl().then((result) => {
						if (result.data?.downloadUrl) {
							setLogoUrl(result.data.downloadUrl);
						}
					});
				} else {
					fetchNationalTeamLogoUrl().then((result) => {
						if (result.data?.downloadUrl) {
							setLogoUrl(result.data.downloadUrl);
						}
					});
				}
			}
		}, [
			isEditing,
			institution,
			logoUrl,
			fetchClubLogoUrl,
			fetchNationalTeamLogoUrl,
		]);

		const handleLogoSelect = async (file: File): Promise<void> => {
			if (!isEditing || !institution) return;

			if (
				!ALLOWED_LOGO_TYPES.includes(
					file.type as (typeof ALLOWED_LOGO_TYPES)[number],
				)
			) {
				toast.error(t("logo.invalidType"));
				return;
			}

			if (file.size > MAX_LOGO_SIZE) {
				toast.error(t("logo.fileTooLarge"));
				return;
			}

			setIsUploadingLogo(true);

			try {
				let uploadUrl: string;
				let key: string;

				if (institution.type === "club") {
					const result = await getClubLogoUploadUrlMutation.mutateAsync({
						clubId: institution.id,
						filename: file.name,
						contentType: file.type as (typeof ALLOWED_LOGO_TYPES)[number],
					});
					uploadUrl = result.uploadUrl;
					key = result.key;
				} else {
					const result = await getNationalTeamLogoUploadUrlMutation.mutateAsync(
						{
							nationalTeamId: institution.id,
							filename: file.name,
							contentType: file.type as (typeof ALLOWED_LOGO_TYPES)[number],
						},
					);
					uploadUrl = result.uploadUrl;
					key = result.key;
				}

				const uploadResponse = await fetch(uploadUrl, {
					method: "PUT",
					body: file,
					headers: { "Content-Type": file.type },
				});

				if (!uploadResponse.ok) {
					throw new Error("Upload failed");
				}

				if (institution.type === "club") {
					await updateClubLogoMutation.mutateAsync({
						clubId: institution.id,
						logoKey: key,
					});
				} else {
					await updateNationalTeamLogoMutation.mutateAsync({
						nationalTeamId: institution.id,
						logoKey: key,
					});
				}

				toast.success(t("logo.uploadSuccess"));
				setHasLogo(true);
				setLogoUrl(null); // Clear to force reload
				utils.organization.institution.list.invalidate();

				// Reload the logo URL
				if (institution.type === "club") {
					const result = await fetchClubLogoUrl();
					if (result.data?.downloadUrl) {
						setLogoUrl(result.data.downloadUrl);
					}
				} else {
					const result = await fetchNationalTeamLogoUrl();
					if (result.data?.downloadUrl) {
						setLogoUrl(result.data.downloadUrl);
					}
				}
			} catch {
				toast.error(t("logo.uploadFailed"));
			} finally {
				setIsUploadingLogo(false);
			}
		};

		const handleDeleteLogo = async (): Promise<void> => {
			if (!isEditing || !institution) return;

			setIsDeletingLogo(true);
			try {
				if (institution.type === "club") {
					await deleteClubLogoMutation.mutateAsync({ clubId: institution.id });
				} else {
					await deleteNationalTeamLogoMutation.mutateAsync({
						nationalTeamId: institution.id,
					});
				}
				toast.success(t("logo.deleteSuccess"));
				setHasLogo(false);
				setLogoUrl(null);
				utils.organization.institution.list.invalidate();
			} catch {
				toast.error(t("logo.deleteFailed"));
			} finally {
				setIsDeletingLogo(false);
			}
		};

		// Club mutations
		const createClubMutation =
			trpc.organization.institution.createClub.useMutation({
				onSuccess: () => {
					toast.success(t("club.createSuccess"));
					utils.organization.institution.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const updateClubMutation =
			trpc.organization.institution.updateClub.useMutation({
				onSuccess: () => {
					toast.success(t("club.updateSuccess"));
					utils.organization.institution.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		// National team mutations
		const createNationalTeamMutation =
			trpc.organization.institution.createNationalTeam.useMutation({
				onSuccess: () => {
					toast.success(t("nationalTeam.createSuccess"));
					utils.organization.institution.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const updateNationalTeamMutation =
			trpc.organization.institution.updateNationalTeam.useMutation({
				onSuccess: () => {
					toast.success(t("nationalTeam.updateSuccess"));
					utils.organization.institution.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const handleTabChange = (value: string) => {
			if (isEditing) return; // Don't allow type change when editing

			const newType = value as "club" | "nationalTeam";
			if (newType === "club") {
				form.reset({
					type: "club",
					name: "",
					shortName: "",
					country: "",
					city: "",
					website: "",
					notes: "",
				});
			} else {
				form.reset({
					type: "nationalTeam",
					name: "",
					country: "",
					category: "",
					notes: "",
				});
			}
		};

		const onSubmit = form.handleSubmit((data: InstitutionFormData) => {
			if (data.type === "club") {
				if (isEditing && institution) {
					updateClubMutation.mutate({
						id: institution.id,
						name: data.name,
						shortName: data.shortName || null,
						country: data.country || null,
						city: data.city || null,
						website: data.website || null,
						notes: data.notes || null,
					});
				} else {
					createClubMutation.mutate({
						name: data.name,
						shortName: data.shortName || undefined,
						country: data.country || undefined,
						city: data.city || undefined,
						website: data.website || undefined,
						notes: data.notes || undefined,
					});
				}
			} else {
				if (isEditing && institution) {
					updateNationalTeamMutation.mutate({
						id: institution.id,
						name: data.name,
						country: data.country,
						category: data.category || null,
						notes: data.notes || null,
					});
				} else {
					createNationalTeamMutation.mutate({
						name: data.name,
						country: data.country,
						category: data.category || undefined,
						notes: data.notes || undefined,
					});
				}
			}
		});

		const isPending =
			createClubMutation.isPending ||
			updateClubMutation.isPending ||
			createNationalTeamMutation.isPending ||
			updateNationalTeamMutation.isPending;

		const HeaderIcon = currentType === "club" ? BriefcaseIcon : FlagIcon;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
					hideDefaultHeader
				>
					{/* Accessibility: visually hidden title and description */}
					<SheetTitle className="sr-only">
						{isEditing ? t("editTitle") : t("createTitle")}
					</SheetTitle>
					<SheetDescription className="sr-only">
						{t("description")}
					</SheetDescription>

					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<HeaderIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{isEditing ? t("editTitle") : t("createTitle")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{t("description")}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								disabled={isPending}
								className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<XIcon className="size-4" />
								<span className="sr-only">Cerrar</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									{/* Type Selector (only for create) */}
									{!isEditing && (
										<Tabs value={currentType} onValueChange={handleTabChange}>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value="club" className="gap-2">
													<BriefcaseIcon className="size-4" />
													{t("club.label")}
												</TabsTrigger>
												<TabsTrigger value="nationalTeam" className="gap-2">
													<FlagIcon className="size-4" />
													{t("nationalTeam.label")}
												</TabsTrigger>
											</TabsList>
										</Tabs>
									)}

									{/* Type indicator when editing */}
									{isEditing && (
										<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
											{currentType === "club" ? (
												<BriefcaseIcon className="size-4 text-muted-foreground" />
											) : (
												<FlagIcon className="size-4 text-muted-foreground" />
											)}
											<span className="text-sm text-muted-foreground">
												{currentType === "club"
													? t("club.label")
													: t("nationalTeam.label")}
											</span>
										</div>
									)}

									{/* Club Fields */}
									{currentType === "club" && (
										<>
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("club.name")}</FormLabel>
															<FormControl>
																<Input
																	placeholder={t("club.namePlaceholder")}
																	autoComplete="off"
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
												name="shortName"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("club.shortName")}</FormLabel>
															<FormControl>
																<Input
																	placeholder={t("club.shortNamePlaceholder")}
																	autoComplete="off"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																{t("club.shortNameHint")}
															</FormDescription>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="country"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("club.country")}</FormLabel>
															<Select
																value={field.value ?? ""}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue
																			placeholder={t("club.countryPlaceholder")}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{COUNTRIES.map((country) => (
																		<SelectItem
																			key={country.code}
																			value={country.name}
																		>
																			{country.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="city"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("club.city")}</FormLabel>
															<FormControl>
																<Input
																	placeholder={t("club.cityPlaceholder")}
																	autoComplete="off"
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
												name="website"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("club.website")}</FormLabel>
															<FormControl>
																<Input
																	type="url"
																	placeholder="https://..."
																	autoComplete="off"
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
												name="notes"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{tCommon("notes")}</FormLabel>
															<FormControl>
																<Textarea
																	placeholder={t("notesPlaceholder")}
																	className="resize-none"
																	rows={3}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* National Team Fields */}
									{currentType === "nationalTeam" && (
										<>
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("nationalTeam.name")}</FormLabel>
															<FormControl>
																<Input
																	placeholder={t(
																		"nationalTeam.namePlaceholder",
																	)}
																	autoComplete="off"
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
												name="country"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("nationalTeam.country")}</FormLabel>
															<Select
																value={field.value ?? ""}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue
																			placeholder={t(
																				"nationalTeam.countryPlaceholder",
																			)}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{COUNTRIES.map((country) => (
																		<SelectItem
																			key={country.code}
																			value={country.name}
																		>
																			{country.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="category"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>
																{t("nationalTeam.category")}
															</FormLabel>
															<FormControl>
																<Input
																	placeholder={t(
																		"nationalTeam.categoryPlaceholder",
																	)}
																	autoComplete="off"
																	{...field}
																/>
															</FormControl>
															<FormDescription>
																{t("nationalTeam.categoryHint")}
															</FormDescription>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="notes"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{tCommon("notes")}</FormLabel>
															<FormControl>
																<Textarea
																	placeholder={t("notesPlaceholder")}
																	className="resize-none"
																	rows={3}
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									{/* Logo Upload Section - Only shown when editing */}
									{isEditing && (
										<Field>
											<FormLabel>{t("logo.title")}</FormLabel>
											{/* Hidden file input */}
											<input
												ref={logoInputRef}
												type="file"
												className="hidden"
												accept={ALLOWED_LOGO_TYPES.join(",")}
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) {
														handleLogoSelect(file);
													}
													e.target.value = "";
												}}
											/>

											{/* Logo preview with overlay delete */}
											{hasLogo && logoUrl ? (
												<div className="relative inline-block overflow-hidden rounded-lg border">
													<img
														src={logoUrl}
														alt={t("logo.title")}
														className="size-32 object-contain bg-muted/30"
													/>
													{/* Action buttons overlay */}
													<div className="absolute top-2 right-2 flex gap-1">
														<button
															type="button"
															onClick={() => logoInputRef.current?.click()}
															disabled={isUploadingLogo}
															className={cn(
																"flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-primary",
																isUploadingLogo &&
																	"pointer-events-none opacity-50",
															)}
														>
															{isUploadingLogo ? (
																<Loader2Icon className="size-4 animate-spin" />
															) : (
																<UploadIcon className="size-4" />
															)}
														</button>
														<button
															type="button"
															onClick={handleDeleteLogo}
															disabled={isDeletingLogo}
															className={cn(
																"flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-destructive",
																isDeletingLogo &&
																	"pointer-events-none opacity-50",
															)}
														>
															{isDeletingLogo ? (
																<Loader2Icon className="size-4 animate-spin" />
															) : (
																<Trash2Icon className="size-4" />
															)}
														</button>
													</div>
												</div>
											) : (
												/* Upload area */
												<button
													type="button"
													onClick={() => logoInputRef.current?.click()}
													disabled={isUploadingLogo}
													className={cn(
														"flex size-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
														isUploadingLogo
															? "pointer-events-none border-muted-foreground/25 opacity-50"
															: "border-muted-foreground/25 hover:border-muted-foreground/50",
													)}
												>
													{isUploadingLogo ? (
														<>
															<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
															<span className="text-muted-foreground text-sm">
																{t("logo.uploading")}
															</span>
														</>
													) : (
														<>
															<UploadIcon className="size-8 text-muted-foreground" />
															<span className="text-muted-foreground text-sm">
																{t("logo.upload")}
															</span>
															<span className="text-muted-foreground/60 text-xs">
																{t("logo.hint")}
															</span>
														</>
													)}
												</button>
											)}
										</Field>
									)}
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-3">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
									className="min-w-[100px]"
								>
									<XIcon className="size-4" />
									{tCommon("cancel")}
								</Button>
								<Button
									type="submit"
									disabled={isPending}
									loading={isPending}
									className="min-w-[100px]"
								>
									{isEditing ? (
										<CheckIcon className="size-4" />
									) : (
										<PlusIcon className="size-4" />
									)}
									{isEditing ? tCommon("save") : tCommon("create")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
