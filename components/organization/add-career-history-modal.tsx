"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { BriefcaseIcon, CalendarIcon, FlagIcon } from "lucide-react";
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

// TODO: Implement club/nationalTeam selectors instead of text inputs
const careerHistorySchema = z.object({
	clubId: z.string().uuid().optional().nullable(),
	nationalTeamId: z.string().uuid().optional().nullable(),
	startDate: z.date().optional().nullable(),
	endDate: z.date().optional().nullable(),
	position: z.string().trim().max(100).optional(),
	achievements: z.string().trim().max(2000).optional(),
	notes: z.string().trim().max(1000).optional(),
});

type CareerHistoryFormData = z.infer<typeof careerHistorySchema>;

interface AddCareerHistoryModalProps {
	athleteId: string;
	initialValues?: {
		id: string;
		clubId: string | null;
		nationalTeamId: string | null;
		startDate: Date | string | null;
		endDate: Date | string | null;
		position: string | null;
		achievements: string | null;
		notes: string | null;
	};
}

export const AddCareerHistoryModal =
	NiceModal.create<AddCareerHistoryModalProps>(
		({ athleteId, initialValues }) => {
			const t = useTranslations("athletes");
			const modal = useEnhancedModal();
			const utils = trpc.useUtils();
			const isEditing = !!initialValues;

			const form = useZodForm({
				schema: careerHistorySchema,
				defaultValues: {
					clubId: initialValues?.clubId ?? null,
					nationalTeamId: initialValues?.nationalTeamId ?? null,
					startDate: initialValues?.startDate
						? new Date(initialValues.startDate)
						: null,
					endDate: initialValues?.endDate
						? new Date(initialValues.endDate)
						: null,
					position: initialValues?.position ?? "",
					achievements: initialValues?.achievements ?? "",
					notes: initialValues?.notes ?? "",
				},
			});

			const isNationalTeam = !!form.watch("nationalTeamId");

			const handleTabChange = (value: string) => {
				if (value === "national") {
					form.setValue("clubId", null);
				} else {
					form.setValue("nationalTeamId", null);
				}
			};

			const createMutation =
				trpc.organization.athlete.createCareerHistory.useMutation({
					onSuccess: () => {
						toast.success(t("career.recordSuccess"));
						utils.organization.athlete.getProfile.invalidate({
							id: athleteId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const updateMutation =
				trpc.organization.athlete.updateCareerHistory.useMutation({
					onSuccess: () => {
						toast.success(t("career.updateSuccess"));
						utils.organization.athlete.getProfile.invalidate({
							id: athleteId,
						});
						modal.handleClose();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				});

			const onSubmit = form.handleSubmit((data: CareerHistoryFormData) => {
				const payload = {
					clubId: data.clubId ?? undefined,
					nationalTeamId: data.nationalTeamId ?? undefined,
					startDate: data.startDate ?? undefined,
					endDate: data.endDate ?? undefined,
					position: data.position || undefined,
					achievements: data.achievements || undefined,
					notes: data.notes || undefined,
				};

				if (isEditing && initialValues) {
					updateMutation.mutate({
						id: initialValues.id,
						...payload,
					});
				} else {
					createMutation.mutate({
						athleteId,
						...payload,
					});
				}
			});

			const isPending = createMutation.isPending || updateMutation.isPending;

			return (
				<ProfileEditSheet
					open={modal.visible}
					onClose={modal.handleClose}
					title={isEditing ? t("career.editEntry") : t("career.addEntry")}
					subtitle={t("career.subtitle")}
					icon={<BriefcaseIcon className="size-5" />}
					accentColor="slate"
					form={form}
					onSubmit={onSubmit}
					isPending={isPending}
					maxWidth="md"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<div className="space-y-6">
						{/* TODO: Implement club/nationalTeam selectors */}
						<Tabs
							defaultValue={isNationalTeam ? "national" : "club"}
							onValueChange={handleTabChange}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="club" className="gap-2">
									<BriefcaseIcon className="size-4" />
									{t("career.clubsTeams")}
								</TabsTrigger>
								<TabsTrigger value="national" className="gap-2">
									<FlagIcon className="size-4" />
									{t("career.nationalTeamSelections")}
								</TabsTrigger>
							</TabsList>

							<TabsContent value="club" className="mt-4">
								<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
									{t("career.selectClubPlaceholder", {
										defaultValue:
											"Club selector pendiente. Configura clubs en la sección de configuración.",
									})}
								</div>
							</TabsContent>

							<TabsContent value="national" className="mt-4">
								<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
									{t("career.selectNationalTeamPlaceholder", {
										defaultValue:
											"Selector de selección pendiente. Configura selecciones en la sección de configuración.",
									})}
								</div>
							</TabsContent>
						</Tabs>

						{/* Period */}
						<ProfileEditSection
							title={t("career.period")}
							description={t("career.endDateHint")}
						>
							<ProfileEditGrid cols={2}>
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>{t("career.startDate")}</FormLabel>
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
																<span>{t("career.selectDate")}</span>
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
											<FormLabel>{t("career.endDate")}</FormLabel>
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
																<span>{t("career.present")}</span>
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

						{/* Details */}
						<ProfileEditSection title={t("career.details")}>
							<FormField
								control={form.control}
								name="position"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("career.position")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("career.positionPlaceholder")}
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
											<FormLabel>{t("career.achievements")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("career.achievementsPlaceholder")}
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
											<FormLabel>{t("career.notes")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("career.notesPlaceholder")}
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
