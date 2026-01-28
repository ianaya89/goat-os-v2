"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { BriefcaseIcon, CalendarIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
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
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
	AthleteSport,
	AthleteSports,
	CoachExperienceLevel,
	CoachExperienceLevels,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const coachExperienceSchema = z.object({
	institutionName: z.string().trim().min(1, "Required").max(200),
	role: z.string().trim().min(1, "Required").max(100),
	sport: z.nativeEnum(AthleteSport).optional().nullable(),
	level: z.nativeEnum(CoachExperienceLevel).optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	achievements: z.string().trim().max(2000).optional(),
	description: z.string().trim().max(2000).optional(),
});

type CoachExperienceFormData = z.infer<typeof coachExperienceSchema>;

interface CoachExperienceEditModalProps {
	coachId: string;
	initialValues?: {
		id: string;
		institutionName: string;
		role: string;
		sport: AthleteSport | null;
		level: CoachExperienceLevel | null;
		startDate: Date | string | null;
		endDate: Date | string | null;
		achievements: string | null;
		description: string | null;
	};
}

export const CoachExperienceEditModal =
	NiceModal.create<CoachExperienceEditModalProps>(
		({ coachId, initialValues }) => {
			const t = useTranslations("coaches");
			const tCommon = useTranslations("common");
			const modal = useEnhancedModal();
			const utils = trpc.useUtils();
			const isEditing = !!initialValues;

			const form = useZodForm({
				schema: coachExperienceSchema,
				defaultValues: {
					institutionName: initialValues?.institutionName ?? "",
					role: initialValues?.role ?? "",
					sport: initialValues?.sport ?? null,
					level: initialValues?.level ?? null,
					startDate: initialValues?.startDate
						? new Date(initialValues.startDate)
						: null,
					endDate: initialValues?.endDate
						? new Date(initialValues.endDate)
						: null,
					achievements: initialValues?.achievements ?? "",
					description: initialValues?.description ?? "",
				},
			});

			const createMutation =
				trpc.organization.coach.createSportsExperience.useMutation({
					onSuccess: () => {
						toast.success(t("experience.createSuccess"));
						utils.organization.coach.listSportsExperience.invalidate({
							coachId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const updateMutation =
				trpc.organization.coach.updateSportsExperience.useMutation({
					onSuccess: () => {
						toast.success(t("experience.updateSuccess"));
						utils.organization.coach.listSportsExperience.invalidate({
							coachId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const deleteMutation =
				trpc.organization.coach.deleteSportsExperience.useMutation({
					onSuccess: () => {
						toast.success(t("experience.deleteSuccess"));
						utils.organization.coach.listSportsExperience.invalidate({
							coachId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const onSubmit = form.handleSubmit((data: CoachExperienceFormData) => {
				const payload = {
					institutionName: data.institutionName,
					role: data.role,
					sport: data.sport ?? null,
					level: data.level ?? null,
					startDate: data.startDate ?? null,
					endDate: data.endDate ?? null,
					achievements: data.achievements || null,
					description: data.description || null,
				};

				if (isEditing && initialValues) {
					updateMutation.mutate({
						id: initialValues.id,
						...payload,
					});
				} else {
					createMutation.mutate({
						coachId,
						...payload,
					});
				}
			});

			const handleDelete = () => {
				if (initialValues) {
					deleteMutation.mutate({ id: initialValues.id });
				}
			};

			const isPending =
				createMutation.isPending ||
				updateMutation.isPending ||
				deleteMutation.isPending;

			return (
				<ProfileEditSheet
					open={modal.visible}
					onClose={modal.handleClose}
					title={
						isEditing ? t("experience.editEntry") : t("experience.addEntry")
					}
					subtitle={t("experience.subtitle")}
					icon={<BriefcaseIcon className="size-5" />}
					accentColor="slate"
					form={form}
					onSubmit={onSubmit}
					isPending={isPending}
					maxWidth="md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<div className="space-y-6">
						{/* Basic Info */}
						<ProfileEditSection
							title={t("experience.basicInfo")}
							description={t("experience.basicInfoDesc")}
						>
							<FormField
								control={form.control}
								name="institutionName"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("experience.institutionName")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"experience.institutionNamePlaceholder",
													)}
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
								name="role"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("experience.role")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("experience.rolePlaceholder")}
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
									name="sport"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("experience.sport")}</FormLabel>
												<Select
													value={field.value ?? ""}
													onValueChange={(value) =>
														field.onChange(value || null)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t("experience.sportPlaceholder")}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{AthleteSports.map((sport) => (
															<SelectItem key={sport} value={sport}>
																{tCommon(`sports.${sport}`)}
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
									name="level"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("experience.level")}</FormLabel>
												<Select
													value={field.value ?? ""}
													onValueChange={(value) =>
														field.onChange(value || null)
													}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue
																placeholder={t("experience.levelPlaceholder")}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{CoachExperienceLevels.map((level) => (
															<SelectItem key={level} value={level}>
																{t(`experience.levels.${level}`)}
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
						</ProfileEditSection>

						{/* Period */}
						<ProfileEditSection
							title={t("experience.period")}
							description={t("experience.periodDesc")}
						>
							<ProfileEditGrid cols={2}>
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>{t("experience.startDate")}</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value, "MMM yyyy")
															) : (
																<span>{t("experience.selectDate")}</span>
															)}
															<CalendarIcon className="ml-auto size-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														disabled={(date) =>
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="endDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>{t("experience.endDate")}</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															{field.value ? (
																format(field.value, "MMM yyyy")
															) : (
																<span>{t("experience.present")}</span>
															)}
															<CalendarIcon className="ml-auto size-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value ?? undefined}
														onSelect={field.onChange}
														disabled={(date) =>
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>
							</ProfileEditGrid>
						</ProfileEditSection>

						{/* Additional Details */}
						<ProfileEditSection
							title={t("experience.additionalDetails")}
							description={t("experience.additionalDetailsDesc")}
						>
							<FormField
								control={form.control}
								name="achievements"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("experience.achievements")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("experience.achievementsPlaceholder")}
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
								name="description"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("experience.description")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("experience.descriptionPlaceholder")}
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
						</ProfileEditSection>

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
												{t("experience.deleteConfirmTitle")}
											</AlertDialogTitle>
											<AlertDialogDescription>
												{t("experience.deleteConfirmDesc")}
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
