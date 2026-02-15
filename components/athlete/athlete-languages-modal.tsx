"use client";

import NiceModal from "@ebay/nice-modal-react";
import { GlobeIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
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

// levelLabels is now generated inside component via useTranslations

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

const commonLanguageCodes = [
	"es",
	"en",
	"pt",
	"fr",
	"de",
	"it",
	"zh",
	"ja",
	"ko",
	"ar",
	"ru",
] as const;

interface Language {
	id: string;
	language: string;
	level: LanguageProficiencyLevel;
	notes: string | null;
	athleteId: string;
	createdAt: Date;
	updatedAt: Date;
}

interface AthleteLanguagesModalProps {
	languages: Language[];
}

export const AthleteLanguagesModal = NiceModal.create(
	({ languages: initialLanguages }: AthleteLanguagesModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();

		const levelLabels: Record<LanguageProficiencyLevel, string> = {
			[LanguageProficiencyLevel.native]: t("languagesModal.levels.native"),
			[LanguageProficiencyLevel.fluent]: t("languagesModal.levels.fluent"),
			[LanguageProficiencyLevel.advanced]: t("languagesModal.levels.advanced"),
			[LanguageProficiencyLevel.intermediate]: t(
				"languagesModal.levels.intermediate",
			),
			[LanguageProficiencyLevel.basic]: t("languagesModal.levels.basic"),
		};

		const commonLanguages = commonLanguageCodes.map((code) => ({
			code,
			name: t(`languagesModal.commonLanguages.${code}`),
		}));
		const [newLanguage, setNewLanguage] = useState("");
		const [newLevel, setNewLevel] = useState<LanguageProficiencyLevel>(
			LanguageProficiencyLevel.intermediate,
		);
		const [isAddingNew, setIsAddingNew] = useState(false);

		const languagesQuery = trpc.athlete.listMyLanguages.useQuery(undefined, {
			initialData: initialLanguages,
		});

		const addMutation = trpc.athlete.addLanguage.useMutation({
			onSuccess: () => {
				toast.success(t("languagesModal.addSuccess"));
				languagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
				setNewLanguage("");
				setNewLevel(LanguageProficiencyLevel.intermediate);
				setIsAddingNew(false);
			},
			onError: (error) => {
				toast.error(error.message || t("languagesModal.addError"));
			},
		});

		const deleteMutation = trpc.athlete.deleteLanguage.useMutation({
			onSuccess: () => {
				toast.success(t("languagesModal.deleteSuccess"));
				languagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("languagesModal.deleteError"));
			},
		});

		const updateMutation = trpc.athlete.updateLanguage.useMutation({
			onSuccess: () => {
				toast.success(t("languagesModal.updateSuccess"));
				languagesQuery.refetch();
				utils.athlete.getMyProfile.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("languagesModal.updateError"));
			},
		});

		const handleAddLanguage = () => {
			if (!newLanguage.trim()) {
				toast.error(t("languagesModal.selectLanguageError"));
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

		const _isPending =
			addMutation.isPending ||
			deleteMutation.isPending ||
			updateMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("languagesModal.title")}
				subtitle={t("languagesModal.subtitle")}
				icon={<GlobeIcon className="size-5" />}
				accentColor="primary"
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex justify-end">
						<Button variant="outline" onClick={modal.handleClose}>
							{t("common.close")}
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					{/* Existing languages */}
					{languages.length > 0 && (
						<ProfileEditSection title={t("languagesModal.myLanguages")}>
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
						<ProfileEditSection title={t("languagesModal.addNew")}>
							<div className="space-y-4 rounded-xl border-2 border-dashed p-4">
								<Field>
									<FieldLabel>{t("languagesModal.language")}</FieldLabel>
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
													onClick={() => setNewLanguage(lang.name)}
												>
													{lang.name}
												</Button>
											))}
									</div>
									<Input
										className="mt-2"
										placeholder={t("languagesModal.otherLanguage")}
										value={newLanguage}
										onChange={(e) => setNewLanguage(e.target.value)}
									/>
								</Field>

								<Field>
									<FieldLabel>
										{t("languagesModal.proficiencyLevel")}
									</FieldLabel>
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
										{t("common.cancel")}
									</Button>
									<Button
										size="sm"
										onClick={handleAddLanguage}
										disabled={addMutation.isPending || !newLanguage.trim()}
									>
										{addMutation.isPending ? (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										) : (
											<PlusIcon className="mr-2 size-4" />
										)}
										{t("languagesModal.addButton")}
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
							{t("languagesModal.addLanguageButton")}
						</Button>
					)}

					{/* Empty state */}
					{languages.length === 0 && !isAddingNew && (
						<ProfileEditEmpty
							icon={<GlobeIcon className="size-12" />}
							title={t("languagesModal.emptyTitle")}
							description={t("languagesModal.emptyDescription")}
						/>
					)}
				</div>
			</ProfileEditSheet>
		);
	},
);
