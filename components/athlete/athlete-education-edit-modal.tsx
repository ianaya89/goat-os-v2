"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon, GraduationCapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const educationSchema = z.object({
	institution: z.string().min(2).max(200),
	degree: z.string().max(100).optional().nullable(),
	fieldOfStudy: z.string().max(100).optional().nullable(),
	academicYear: z.string().max(50).optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	expectedGraduationDate: z.date().optional().nullable(),
	gpa: z.string().max(10).optional().nullable(),
	isCurrent: z.boolean().default(false),
	notes: z.string().max(500).optional().nullable(),
});

interface EducationEntry {
	id: string;
	institution: string;
	degree: string | null;
	fieldOfStudy: string | null;
	academicYear: string | null;
	startDate: Date | null;
	endDate: Date | null;
	expectedGraduationDate: Date | null;
	gpa: string | null;
	isCurrent: boolean;
	notes: string | null;
}

interface AthleteEducationEditModalProps {
	entry?: EducationEntry;
}

export const AthleteEducationEditModal = NiceModal.create(
	({ entry }: AthleteEducationEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const form = useZodForm({
			schema: educationSchema,
			defaultValues: {
				institution: entry?.institution ?? "",
				degree: entry?.degree ?? "",
				fieldOfStudy: entry?.fieldOfStudy ?? "",
				academicYear: entry?.academicYear ?? "",
				startDate: entry?.startDate ?? null,
				endDate: entry?.endDate ?? null,
				expectedGraduationDate: entry?.expectedGraduationDate ?? null,
				gpa: entry?.gpa ?? "",
				isCurrent: entry?.isCurrent ?? false,
				notes: entry?.notes ?? "",
			},
		});

		const isCurrent = form.watch("isCurrent");

		const addMutation = trpc.athlete.addEducation.useMutation({
			onSuccess: () => {
				toast.success(t("educationModal.addSuccess"));
				utils.athlete.listMyEducation.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.athlete.updateEducation.useMutation({
			onSuccess: () => {
				toast.success(t("educationModal.updateSuccess"));
				utils.athlete.listMyEducation.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.athlete.deleteEducation.useMutation({
			onSuccess: () => {
				toast.success(t("educationModal.deleteSuccess"));
				utils.athlete.listMyEducation.invalidate();
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const isCurrent = data.isCurrent ?? false;
			const payload = {
				institution: data.institution,
				degree: data.degree || null,
				fieldOfStudy: data.fieldOfStudy || null,
				academicYear: data.academicYear || null,
				startDate: data.startDate ?? null,
				endDate: isCurrent ? null : (data.endDate ?? null),
				expectedGraduationDate: data.expectedGraduationDate ?? null,
				gpa: data.gpa || null,
				isCurrent,
				notes: data.notes || null,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				addMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm(t("educationModal.deleteConfirm"))) {
				deleteMutation.mutate({ id: entry.id });
			}
		};

		const isPending =
			addMutation.isPending ||
			updateMutation.isPending ||
			deleteMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={
					isEditing
						? t("educationModal.editTitle")
						: t("educationModal.addTitle")
				}
				subtitle={t("educationModal.subtitle")}
				icon={<GraduationCapIcon className="size-5" />}
				accentColor="violet"
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
					<ProfileEditSection title={t("educationModal.institutionSection")}>
						<FormField
							control={form.control}
							name="institution"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("educationModal.institutionName")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("educationModal.institutionPlaceholder")}
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
								name="degree"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("educationModal.degree")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("educationModal.degreePlaceholder")}
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
								name="fieldOfStudy"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("educationModal.fieldOfStudy")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"educationModal.fieldOfStudyPlaceholder",
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

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="academicYear"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("educationModal.academicYear")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"educationModal.academicYearPlaceholder",
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

							<FormField
								control={form.control}
								name="gpa"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("educationModal.gpa")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("educationModal.gpaPlaceholder")}
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

					<ProfileEditSection title={t("educationModal.periodSection")}>
						<FormField
							control={form.control}
							name="isCurrent"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>{t("educationModal.isCurrent")}</FormLabel>
										<FormDescription>
											Marca esta opcion si aun estas estudiando en esta
											institucion
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("educationModal.startDate")}</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant="outline"
															className={cn(
																"w-full justify-start text-left font-normal",
																!field.value && "text-muted-foreground",
															)}
														>
															<CalendarIcon className="mr-2 size-4" />
															{field.value
																? format(field.value, "MMM yyyy")
																: t("common.select")}
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
										</Field>
									</FormItem>
								)}
							/>

							{!isCurrent && (
								<FormField
									control={form.control}
									name="endDate"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("educationModal.endDate")}</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full justify-start text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																<CalendarIcon className="mr-2 size-4" />
																{field.value
																	? format(field.value, "MMM yyyy")
																	: t("common.select")}
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value ?? undefined}
															onSelect={field.onChange}
															disabled={(date) =>
																date > new Date() ||
																date < new Date("1950-01-01")
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							)}

							{isCurrent && (
								<FormField
									control={form.control}
									name="expectedGraduationDate"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>
													{t("educationModal.expectedGraduation")}
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full justify-start text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																<CalendarIcon className="mr-2 size-4" />
																{field.value
																	? format(field.value, "MMM yyyy")
																	: t("common.select")}
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value ?? undefined}
															onSelect={field.onChange}
															disabled={(date) => date < new Date("1950-01-01")}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormDescription>
													{t("educationModal.expectedGraduationDescription")}
												</FormDescription>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							)}
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("educationModal.notesSection")}>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("educationModal.notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("educationModal.notesPlaceholder")}
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
				</div>
			</ProfileEditSheet>
		);
	},
);
