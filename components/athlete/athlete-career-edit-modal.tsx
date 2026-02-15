"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BriefcaseIcon,
	CalendarIcon,
	FlagIcon,
	TrophyIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { InstitutionSelector } from "@/components/shared/institution-selector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const careerSchema = z.object({
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	position: z.string().max(100).optional().nullable(),
	achievements: z.string().max(1000).optional().nullable(),
	notes: z.string().max(500).optional().nullable(),
});

type CareerFormData = z.infer<typeof careerSchema>;

interface CareerEntry {
	id: string;
	clubId: string | null;
	nationalTeamId: string | null;
	startDate: Date | null;
	endDate: Date | null;
	position: string | null;
	achievements: string | null;
	notes: string | null;
}

interface AthleteCareerEditModalProps {
	athleteId: string;
	entry?: CareerEntry;
}

export const AthleteCareerEditModal = NiceModal.create(
	({ entry }: AthleteCareerEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
		const utils = trpc.useUtils();
		const isEditing = !!entry;

		const form = useZodForm({
			schema: careerSchema,
			defaultValues: {
				clubId: entry?.clubId ?? null,
				nationalTeamId: entry?.nationalTeamId ?? null,
				startDate: entry?.startDate ?? null,
				endDate: entry?.endDate ?? null,
				position: entry?.position ?? "",
				achievements: entry?.achievements ?? "",
				notes: entry?.notes ?? "",
			},
		});

		const isNationalTeam = !!form.watch("nationalTeamId");

		const createMutation = trpc.athlete.addCareerHistory.useMutation({
			onSuccess: () => {
				toast.success(t("careerModal.addSuccess"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const updateMutation = trpc.athlete.updateCareerHistory.useMutation({
			onSuccess: () => {
				toast.success(t("careerModal.updateSuccess"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const deleteMutation = trpc.athlete.deleteCareerHistory.useMutation({
			onSuccess: () => {
				toast.success(t("careerModal.deleteSuccess"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data: CareerFormData) => {
			const payload = {
				clubId: data.clubId ?? undefined,
				nationalTeamId: data.nationalTeamId ?? undefined,
				startDate: data.startDate ?? undefined,
				endDate: data.endDate ?? undefined,
				position: data.position || undefined,
				achievements: data.achievements || undefined,
				notes: data.notes || undefined,
			};

			if (isEditing && entry) {
				updateMutation.mutate({ id: entry.id, ...payload });
			} else {
				createMutation.mutate(payload);
			}
		});

		const handleDelete = () => {
			if (entry && confirm(t("careerModal.deleteConfirm"))) {
				deleteMutation.mutate({ id: entry.id });
			}
		};

		const handleTabChange = (value: string) => {
			if (value === "national") {
				form.setValue("clubId", null);
			} else {
				form.setValue("nationalTeamId", null);
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
					isEditing ? t("careerModal.editTitle") : t("careerModal.addTitle")
				}
				subtitle={t("careerModal.subtitle")}
				icon={<BriefcaseIcon className="size-5" />}
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
					{/* Type Selector */}
					<Tabs
						defaultValue={isNationalTeam ? "national" : "club"}
						onValueChange={handleTabChange}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="club" className="gap-2">
								<BriefcaseIcon className="size-4" />
								Club / Equipo
							</TabsTrigger>
							<TabsTrigger value="national" className="gap-2">
								<FlagIcon className="size-4" />
								Seleccion Nacional
							</TabsTrigger>
						</TabsList>

						<TabsContent value="club" className="mt-4">
							<FormField
								control={form.control}
								name="clubId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("careerModal.clubLabel")}</FormLabel>
											<FormControl>
												<InstitutionSelector
													type="club"
													value={field.value}
													onChange={field.onChange}
													placeholder={t("careerModal.clubPlaceholder")}
												/>
											</FormControl>
											<FormDescription>
												{t("careerModal.clubDescription")}
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</TabsContent>

						<TabsContent value="national" className="mt-4 space-y-4">
							<FormField
								control={form.control}
								name="nationalTeamId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("careerModal.nationalLabel")}</FormLabel>
											<FormControl>
												<InstitutionSelector
													type="nationalTeam"
													value={field.value}
													onChange={field.onChange}
													placeholder={t("careerModal.nationalPlaceholder")}
												/>
											</FormControl>
											<FormDescription>
												{t("careerModal.nationalDescription")}
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</TabsContent>
					</Tabs>

					<ProfileEditSection title={t("careerModal.periodSection")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("careerModal.startDate")}</FormLabel>
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

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("careerModal.endDate")}</FormLabel>
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
																: t("careerModal.present")}
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
											<FormDescription>
												{t("careerModal.endDateDescription")}
											</FormDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>
					</ProfileEditSection>

					<ProfileEditSection title={t("careerModal.detailsSection")}>
						<FormField
							control={form.control}
							name="position"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("careerModal.position")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("careerModal.positionPlaceholder")}
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
							name="achievements"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel className="flex items-center gap-2">
											<TrophyIcon className="size-4 text-amber-500" />
											{t("careerModal.achievements")}
										</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("careerModal.achievementsPlaceholder")}
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
							name="notes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("careerModal.notes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("careerModal.notesPlaceholder")}
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
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
