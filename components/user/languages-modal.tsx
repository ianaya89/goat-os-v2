"use client";

import NiceModal from "@ebay/nice-modal-react";
import { GlobeIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	ProfileEditEmpty,
	ProfileEditItem,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { LanguageProficiencyLevel } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const levelLabels: Record<LanguageProficiencyLevel, string> = {
	[LanguageProficiencyLevel.native]: "Nativo",
	[LanguageProficiencyLevel.fluent]: "Fluido",
	[LanguageProficiencyLevel.advanced]: "Avanzado",
	[LanguageProficiencyLevel.intermediate]: "Intermedio",
	[LanguageProficiencyLevel.basic]: "Basico",
};

const levelColors: Record<LanguageProficiencyLevel, string> = {
	[LanguageProficiencyLevel.native]:
		"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
	[LanguageProficiencyLevel.fluent]:
		"bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
	[LanguageProficiencyLevel.advanced]:
		"bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
	[LanguageProficiencyLevel.intermediate]:
		"bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
	[LanguageProficiencyLevel.basic]:
		"bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const commonLanguages = [
	{ code: "es", name: "Espanol" },
	{ code: "en", name: "Ingles" },
	{ code: "pt", name: "Portugues" },
	{ code: "fr", name: "Frances" },
	{ code: "de", name: "Aleman" },
	{ code: "it", name: "Italiano" },
	{ code: "zh", name: "Chino" },
	{ code: "ja", name: "Japones" },
	{ code: "ko", name: "Coreano" },
	{ code: "ar", name: "Arabe" },
	{ code: "ru", name: "Ruso" },
];

type ProfileVariant = "athlete" | "coach";

interface Language {
	id: string;
	language: string;
	level: LanguageProficiencyLevel;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

interface LanguagesModalProps {
	variant: ProfileVariant;
}

export const LanguagesModal = NiceModal.create(
	({ variant }: LanguagesModalProps) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const [newLanguage, setNewLanguage] = useState("");
		const [newLevel, setNewLevel] = useState<LanguageProficiencyLevel>(
			LanguageProficiencyLevel.intermediate,
		);
		const [isAddingNew, setIsAddingNew] = useState(false);

		// Conditional queries based on variant
		const athleteLanguagesQuery = trpc.athlete.listMyLanguages.useQuery(
			undefined,
			{
				enabled: variant === "athlete",
			},
		);

		const coachLanguagesQuery = trpc.coach.listMyLanguages.useQuery(undefined, {
			enabled: variant === "coach",
		});

		const languagesQuery =
			variant === "athlete" ? athleteLanguagesQuery : coachLanguagesQuery;

		// Conditional mutations based on variant
		const athleteAddMutation = trpc.athlete.addLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma agregado");
				athleteLanguagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
				setNewLanguage("");
				setNewLevel(LanguageProficiencyLevel.intermediate);
				setIsAddingNew(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar idioma");
			},
		});

		const coachAddMutation = trpc.coach.addLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma agregado");
				coachLanguagesQuery.refetch();
				utils.coach.getMyProfile.invalidate();
				setNewLanguage("");
				setNewLevel(LanguageProficiencyLevel.intermediate);
				setIsAddingNew(false);
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar idioma");
			},
		});

		const athleteDeleteMutation = trpc.athlete.deleteLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma eliminado");
				athleteLanguagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar idioma");
			},
		});

		const coachDeleteMutation = trpc.coach.deleteLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma eliminado");
				coachLanguagesQuery.refetch();
				utils.coach.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar idioma");
			},
		});

		const athleteUpdateMutation = trpc.athlete.updateLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma actualizado");
				athleteLanguagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar idioma");
			},
		});

		const coachUpdateMutation = trpc.coach.updateLanguage.useMutation({
			onSuccess: () => {
				toast.success("Idioma actualizado");
				coachLanguagesQuery.refetch();
				utils.coach.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar idioma");
			},
		});

		const addMutation =
			variant === "athlete" ? athleteAddMutation : coachAddMutation;
		const deleteMutation =
			variant === "athlete" ? athleteDeleteMutation : coachDeleteMutation;
		const updateMutation =
			variant === "athlete" ? athleteUpdateMutation : coachUpdateMutation;

		const handleAddLanguage = () => {
			if (!newLanguage.trim()) {
				toast.error("Selecciona o escribe un idioma");
				return;
			}
			addMutation.mutate({
				language: newLanguage.trim(),
				level: newLevel,
			});
		};

		const handleUpdateLevel = (id: string, level: LanguageProficiencyLevel) => {
			updateMutation.mutate({ id, level });
		};

		const handleDelete = (id: string) => {
			deleteMutation.mutate({ id });
		};

		const languages = languagesQuery.data ?? [];

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title="Idiomas"
				subtitle="Agrega los idiomas que hablas y tu nivel"
				icon={<GlobeIcon className="size-5" />}
				accentColor="sky"
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex justify-end">
						<Button variant="outline" onClick={modal.handleClose}>
							Cerrar
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Existing languages */}
					{languages.length > 0 && (
						<ProfileEditSection title="Mis idiomas">
							<AnimatePresence mode="popLayout">
								{languages.map((lang) => (
									<ProfileEditItem
										key={lang.id}
										onRemove={() => handleDelete(lang.id)}
										isRemoving={deleteMutation.isPending}
									>
										<div className="flex items-center gap-3">
											<span className="font-medium">{lang.language}</span>
											<Select
												value={lang.level}
												onValueChange={(value) =>
													handleUpdateLevel(
														lang.id,
														value as LanguageProficiencyLevel,
													)
												}
											>
												<SelectTrigger className="h-7 w-auto border-none bg-transparent p-0 shadow-none focus:ring-0">
													<Badge
														className={cn(
															"cursor-pointer border-none transition-transform hover:scale-105",
															levelColors[lang.level],
														)}
													>
														{levelLabels[lang.level]}
													</Badge>
												</SelectTrigger>
												<SelectContent>
													{Object.entries(levelLabels).map(([value, label]) => (
														<SelectItem key={value} value={value}>
															<div className="flex items-center gap-2">
																<div
																	className={cn(
																		"size-2 rounded-full",
																		value === LanguageProficiencyLevel.native &&
																			"bg-emerald-500",
																		value === LanguageProficiencyLevel.fluent &&
																			"bg-sky-500",
																		value ===
																			LanguageProficiencyLevel.advanced &&
																			"bg-violet-500",
																		value ===
																			LanguageProficiencyLevel.intermediate &&
																			"bg-amber-500",
																		value === LanguageProficiencyLevel.basic &&
																			"bg-zinc-400",
																	)}
																/>
																{label}
															</div>
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</ProfileEditItem>
								))}
							</AnimatePresence>
						</ProfileEditSection>
					)}

					{/* Add new language form */}
					{isAddingNew ? (
						<ProfileEditSection title="Agregar nuevo idioma">
							<div className="space-y-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/30">
								<Field>
									<FieldLabel>Idioma</FieldLabel>
									<div className="flex flex-wrap gap-2">
										{commonLanguages
											.filter(
												(l) =>
													!languages.some(
														(existing) =>
															existing.language.toLowerCase() ===
															l.name.toLowerCase(),
													),
											)
											.slice(0, 6)
											.map((lang) => (
												<Button
													key={lang.code}
													type="button"
													variant={
														newLanguage === lang.name ? "default" : "outline"
													}
													size="sm"
													className={cn(
														newLanguage === lang.name &&
															"bg-sky-500 hover:bg-sky-600",
													)}
													onClick={() => setNewLanguage(lang.name)}
												>
													{lang.name}
												</Button>
											))}
									</div>
									<Input
										className="mt-2"
										placeholder="O escribe otro idioma..."
										value={newLanguage}
										onChange={(e) => setNewLanguage(e.target.value)}
									/>
								</Field>

								<Field>
									<FieldLabel>Nivel de competencia</FieldLabel>
									<Select
										value={newLevel}
										onValueChange={(v) =>
											setNewLevel(v as LanguageProficiencyLevel)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(levelLabels).map(([value, label]) => (
												<SelectItem key={value} value={value}>
													<div className="flex items-center gap-2">
														<div
															className={cn(
																"size-2 rounded-full",
																value === LanguageProficiencyLevel.native &&
																	"bg-emerald-500",
																value === LanguageProficiencyLevel.fluent &&
																	"bg-sky-500",
																value === LanguageProficiencyLevel.advanced &&
																	"bg-violet-500",
																value ===
																	LanguageProficiencyLevel.intermediate &&
																	"bg-amber-500",
																value === LanguageProficiencyLevel.basic &&
																	"bg-zinc-400",
															)}
														/>
														{label}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>

								<div className="flex gap-2 pt-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setIsAddingNew(false);
											setNewLanguage("");
										}}
									>
										Cancelar
									</Button>
									<Button
										size="sm"
										onClick={handleAddLanguage}
										disabled={addMutation.isPending || !newLanguage.trim()}
										className="bg-sky-500 hover:bg-sky-600"
									>
										{addMutation.isPending ? (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										) : (
											<PlusIcon className="mr-2 size-4" />
										)}
										Agregar
									</Button>
								</div>
							</div>
						</ProfileEditSection>
					) : (
						<Button
							variant="outline"
							className="w-full border-dashed"
							onClick={() => setIsAddingNew(true)}
						>
							<PlusIcon className="mr-2 size-4" />
							Agregar idioma
						</Button>
					)}

					{/* Empty state */}
					{languages.length === 0 && !isAddingNew && (
						<ProfileEditEmpty
							icon={<GlobeIcon className="size-12" />}
							title="No has agregado ningun idioma todavia"
							description="Los idiomas pueden ayudarte a destacar en oportunidades internacionales"
						/>
					)}
				</div>
			</ProfileEditSheet>
		);
	},
);
