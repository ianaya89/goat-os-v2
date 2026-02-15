"use client";

import NiceModal from "@ebay/nice-modal-react";
import { TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	AchievementScope,
	AchievementScopes,
	AchievementType,
	AchievementTypes,
} from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const achievementSchema = z.object({
	title: z.string().min(2).max(200),
	type: z.nativeEnum(AchievementType),
	scope: z.nativeEnum(AchievementScope),
	year: z.coerce.number().int().min(1900).max(2100),
	organization: z.string().max(200).optional().nullable(),
	team: z.string().max(200).optional().nullable(),
	competition: z.string().max(200).optional().nullable(),
	position: z.string().max(100).optional().nullable(),
	description: z.string().max(1000).optional().nullable(),
	isPublic: z.boolean().default(true),
});

interface AchievementEntry {
	id: string;
	title: string;
	type: AchievementType;
	scope: AchievementScope;
	year: number;
	organization: string | null;
	team: string | null;
	competition: string | null;
	position: string | null;
	description: string | null;
	isPublic: boolean;
}

interface AthleteAchievementsEditModalProps {
	entry?: AchievementEntry;
}

export const AthleteAchievementsEditModal = NiceModal.create(
	({ entry }: AthleteAchievementsEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const typeLabels: Record<AchievementType, string> = {
			championship: t("achievementsModal.types.championship"),
			award: t("achievementsModal.types.award"),
			selection: t("achievementsModal.types.selection"),
			record: t("achievementsModal.types.record"),
			recognition: t("achievementsModal.types.recognition"),
			mvp: t("achievementsModal.types.mvp"),
			top_scorer: t("achievementsModal.types.top_scorer"),
			best_player: t("achievementsModal.types.best_player"),
			all_star: t("achievementsModal.types.all_star"),
			scholarship: t("achievementsModal.types.scholarship"),
			other: t("achievementsModal.types.other"),
		};

		const scopeLabels: Record<AchievementScope, string> = {
			individual: t("achievementsModal.scopes.individual"),
			collective: t("achievementsModal.scopes.collective"),
		};

		const form = useZodForm({
			schema: achievementSchema,
			defaultValues: {
				title: entry?.title ?? "",
				type: entry?.type ?? AchievementType.championship,
				scope: entry?.scope ?? AchievementScope.individual,
				year: entry?.year ?? new Date().getFullYear(),
				organization: entry?.organization ?? "",
				team: entry?.team ?? "",
				competition: entry?.competition ?? "",
				position: entry?.position ?? "",
				description: entry?.description ?? "",
				isPublic: entry?.isPublic ?? true,
			},
		});

		const scope = form.watch("scope");

		const addMutation = trpc.athlete.addAchievement.useMutation({
			onSuccess: () => {
				toast.success(t("achievementsModal.addSuccess"));
				utils.athlete.listMyAchievements.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.athlete.updateAchievement.useMutation({
			onSuccess: () => {
				toast.success(t("achievementsModal.updateSuccess"));
				utils.athlete.listMyAchievements.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.athlete.deleteAchievement.useMutation({
			onSuccess: () => {
				toast.success(t("achievementsModal.deleteSuccess"));
				utils.athlete.listMyAchievements.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const payload = {
				title: data.title,
				type: data.type,
				scope: data.scope,
				year: Number(data.year),
				organization: data.organization || null,
				team: data.team || null,
				competition: data.competition || null,
				position: data.position || null,
				description: data.description || null,
				isPublic: data.isPublic ?? true,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				addMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm(t("achievementsModal.deleteConfirm"))) {
				deleteMutation.mutate({ id: entry.id });
			}
		};

		const isPending =
			addMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending;

		// Generate year options (current year down to 1950)
		const currentYear = new Date().getFullYear();
		const yearOptions = Array.from(
			{ length: currentYear - 1949 },
			(_, i) => currentYear - i,
		);

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={
					isEditing
						? t("achievementsModal.editTitle")
						: t("achievementsModal.addTitle")
				}
				subtitle={t("achievementsModal.subtitle")}
				icon={<TrophyIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? t("common.save") : t("common.add")}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex items-center justify-between">
						{isEditing ? (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={handleDelete}
								disabled={isPending}
							>
								{t("common.delete")}
							</Button>
						) : (
							<div />
						)}
						<div className="flex gap-3">
							<Button
								type="button"
								variant="ghost"
								onClick={modal.handleClose}
								disabled={isPending}
							>
								{t("common.cancel")}
							</Button>
							<Button type="submit" disabled={isPending} loading={isPending}>
								{isEditing ? t("common.save") : t("common.add")}
							</Button>
						</div>
					</div>
				}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("achievementsModal.infoSection")}>
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("achievementsModal.titleLabel")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("achievementsModal.titlePlaceholder")}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("achievementsModal.typeLabel")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"achievementsModal.typePlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{AchievementTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{typeLabels[type as AchievementType]}
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
								name="scope"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("achievementsModal.scopeLabel")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"achievementsModal.scopePlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{AchievementScopes.map((s) => (
														<SelectItem key={s} value={s}>
															{scopeLabels[s as AchievementScope]}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												{t("achievementsModal.scopeDescription")}
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="year"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("achievementsModal.yearLabel")}</FormLabel>
											<Select
												onValueChange={(v) => field.onChange(Number(v))}
												defaultValue={String(field.value)}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue
															placeholder={t(
																"achievementsModal.yearPlaceholder",
															)}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{yearOptions.map((year) => (
														<SelectItem key={year} value={String(year)}>
															{year}
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
								name="position"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>
												{t("achievementsModal.positionLabel")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"achievementsModal.positionPlaceholder",
													)}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("achievementsModal.contextSection")}>
						<FormField
							control={form.control}
							name="competition"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>
											{t("achievementsModal.competitionLabel")}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"achievementsModal.competitionPlaceholder",
												)}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="organization"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>
												{t("achievementsModal.organizationLabel")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"achievementsModal.organizationPlaceholder",
													)}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												{t("achievementsModal.organizationDescription")}
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							{scope === AchievementScope.collective && (
								<FormField
									control={form.control}
									name="team"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>
													{t("achievementsModal.teamLabel")}
												</FormLabel>
												<FormControl>
													<Input
														placeholder={t("achievementsModal.teamPlaceholder")}
														{...field}
														value={field.value ?? ""}
													/>
												</FormControl>
												<FormDescription>
													{t("achievementsModal.teamDescription")}
												</FormDescription>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							)}
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("achievementsModal.detailsSection")}>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>
											{t("achievementsModal.descriptionLabel")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t(
													"achievementsModal.descriptionPlaceholder",
												)}
												className="resize-none"
												rows={3}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isPublic"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>
											{t("achievementsModal.isPublicLabel")}
										</FormLabel>
										<FormDescription>
											{t("achievementsModal.isPublicDescription")}
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
