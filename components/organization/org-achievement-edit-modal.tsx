"use client";

import NiceModal from "@ebay/nice-modal-react";
import { TrashIcon, TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
	title: z.string().min(2, "Title is required").max(200),
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

interface OrgAchievementEditModalProps {
	athleteId?: string;
	coachId?: string;
	entry?: AchievementEntry;
}

export const OrgAchievementEditModal = NiceModal.create(
	({ athleteId, coachId, entry }: OrgAchievementEditModalProps) => {
		const t = useTranslations("achievements");
		const tCommon = useTranslations("common");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!entry;
		const isAthlete = !!athleteId;

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

		// Athlete mutations
		const addAthleteMutation =
			trpc.organization.athlete.createAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("createSuccess"));
					if (athleteId) {
						utils.organization.athlete.listAchievements.invalidate({
							athleteId,
						});
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const updateAthleteMutation =
			trpc.organization.athlete.updateAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("updateSuccess"));
					if (athleteId) {
						utils.organization.athlete.listAchievements.invalidate({
							athleteId,
						});
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const deleteAthleteMutation =
			trpc.organization.athlete.deleteAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("deleteSuccess"));
					if (athleteId) {
						utils.organization.athlete.listAchievements.invalidate({
							athleteId,
						});
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		// Coach mutations
		const addCoachMutation =
			trpc.organization.coach.createAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("createSuccess"));
					if (coachId) {
						utils.organization.coach.listAchievements.invalidate({ coachId });
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const updateCoachMutation =
			trpc.organization.coach.updateAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("updateSuccess"));
					if (coachId) {
						utils.organization.coach.listAchievements.invalidate({ coachId });
					}
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const deleteCoachMutation =
			trpc.organization.coach.deleteAchievement.useMutation({
				onSuccess: () => {
					toast.success(t("deleteSuccess"));
					if (coachId) {
						utils.organization.coach.listAchievements.invalidate({ coachId });
					}
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
				organization: data.organization || undefined,
				team: data.team || undefined,
				competition: data.competition || undefined,
				position: data.position || undefined,
				description: data.description || undefined,
				isPublic: data.isPublic ?? true,
			};

			if (isAthlete) {
				if (isEditing && entry) {
					updateAthleteMutation.mutate({ id: entry.id, ...payload });
				} else {
					addAthleteMutation.mutate({ athleteId: athleteId!, ...payload });
				}
			} else {
				if (isEditing && entry) {
					updateCoachMutation.mutate({ id: entry.id, ...payload });
				} else {
					addCoachMutation.mutate({ coachId: coachId!, ...payload });
				}
			}
		});

		const handleDelete = () => {
			if (entry) {
				if (isAthlete) {
					deleteAthleteMutation.mutate({ id: entry.id });
				} else {
					deleteCoachMutation.mutate({ id: entry.id });
				}
			}
		};

		const isPending = isAthlete
			? addAthleteMutation.isPending ||
				updateAthleteMutation.isPending ||
				deleteAthleteMutation.isPending
			: addCoachMutation.isPending ||
				updateCoachMutation.isPending ||
				deleteCoachMutation.isPending;

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
				title={isEditing ? t("editEntry") : t("addEntry")}
				subtitle={t("subtitle")}
				icon={<TrophyIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? tCommon("save") : tCommon("add")}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-4">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>{t("title")}</FormLabel>
									<FormControl>
										<Input placeholder={t("titlePlaceholder")} {...field} />
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
										<FormLabel>{t("type")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("typePlaceholder")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{AchievementTypes.map((type) => (
													<SelectItem key={type} value={type}>
														{t(`types.${type}`)}
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
										<FormLabel>{t("scope")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("scopePlaceholder")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{AchievementScopes.map((s) => (
													<SelectItem key={s} value={s}>
														{t(`scopes.${s}`)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
										<FormLabel>{t("year")}</FormLabel>
										<Select
											onValueChange={(v) => field.onChange(Number(v))}
											defaultValue={String(field.value)}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("yearPlaceholder")} />
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
										<FormLabel>{t("position")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("positionPlaceholder")}
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

					<ProfileEditGrid cols={2} className="items-start">
						<FormField
							control={form.control}
							name="competition"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("competition")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("competitionPlaceholder")}
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
							name="organization"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("organization")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("organizationPlaceholder")}
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

					{scope === AchievementScope.collective && (
						<FormField
							control={form.control}
							name="team"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("team")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("teamPlaceholder")}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					)}

					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>{t("description")}</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("descriptionPlaceholder")}
											className="resize-none"
											rows={2}
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
									<FormLabel>{t("isPublic")}</FormLabel>
									<FormDescription>{t("isPublicDesc")}</FormDescription>
								</div>
							</FormItem>
						)}
					/>

					{/* Delete Button (only in edit mode) */}
					{isEditing && (
						<div className="border-t pt-4">
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
									>
										<TrashIcon className="mr-2 size-4" />
										{tCommon("delete")}
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{t("deleteConfirmTitle")}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{t("deleteConfirmDesc")}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											{tCommon("delete")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					)}
				</div>
			</ProfileEditSheet>
		);
	},
);
