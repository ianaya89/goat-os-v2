"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
	type AthleteSport,
	AthleteSports,
	CompetitionStatus,
	CompetitionStatuses,
	CompetitionType,
	CompetitionTypes,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import {
	createCompetitionSchema,
	updateCompetitionSchema,
} from "@/schemas/organization-competition-schemas";
import { trpc } from "@/trpc/client";

interface Competition {
	id: string;
	name: string;
	description: string | null;
	type: string;
	sport: string | null;
	seasonId: string | null;
	startDate: Date | null;
	endDate: Date | null;
	status: string;
	venue: string | null;
}

interface CompetitionsModalProps {
	competition?: Competition;
}

export const CompetitionsModal = NiceModal.create<CompetitionsModalProps>(
	({ competition }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("competitions");
		const tc = useTranslations("common");
		const isEditing = !!competition;
		const utils = trpc.useUtils();

		const { data: seasons } = trpc.organization.season.listActive.useQuery();

		const form = useZodForm({
			schema: isEditing ? updateCompetitionSchema : createCompetitionSchema,
			defaultValues: {
				id: competition?.id,
				name: competition?.name ?? "",
				description: competition?.description ?? "",
				type:
					(competition?.type as (typeof CompetitionType)[keyof typeof CompetitionType]) ??
					CompetitionType.tournament,
				sport:
					(competition?.sport as (typeof AthleteSport)[keyof typeof AthleteSport]) ??
					undefined,
				seasonId: competition?.seasonId ?? undefined,
				startDate: competition?.startDate
					? new Date(competition.startDate)
					: undefined,
				endDate: competition?.endDate
					? new Date(competition.endDate)
					: undefined,
				status:
					(competition?.status as (typeof CompetitionStatus)[keyof typeof CompetitionStatus]) ??
					CompetitionStatus.upcoming,
				venue: competition?.venue ?? "",
			},
		});

		const createMutation = trpc.organization.competition.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.created"));
				utils.organization.competition.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateMutation = trpc.organization.competition.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.competition.list.invalidate();
				utils.organization.competition.get.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing && competition) {
				updateMutation.mutate({
					id: competition.id,
					name: data.name,
					description: data.description,
					type: data.type,
					sport: data.sport,
					seasonId: data.seasonId,
					startDate:
						data.startDate instanceof Date ? data.startDate : undefined,
					endDate: data.endDate instanceof Date ? data.endDate : undefined,
					status: data.status,
					logoKey: data.logoKey,
					externalId: data.externalId,
					venue: data.venue,
					rules: data.rules,
				});
			} else {
				const name = data.name || "";
				const type = data.type!;
				createMutation.mutate({
					name,
					type,
					description: data.description,
					sport: data.sport,
					seasonId: data.seasonId,
					startDate:
						data.startDate instanceof Date ? data.startDate : undefined,
					endDate: data.endDate instanceof Date ? data.endDate : undefined,
					status: data.status,
					logoKey: data.logoKey,
					externalId: data.externalId,
					venue: data.venue,
					rules: data.rules,
				});
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
				subtitle={
					isEditing ? t("modal.editSubtitle") : t("modal.createSubtitle")
				}
				icon={<TrophyIcon className="size-5" />}
				accentColor="amber"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? t("modal.update") : t("modal.create")}
				cancelLabel={t("modal.cancel")}
				maxWidth="lg"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.name")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("form.namePlaceholder")}
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
							name="description"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.description")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("form.descriptionPlaceholder")}
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

					<ProfileEditSection>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.type")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CompetitionTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{t(`type.${type}`)}
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
								name="status"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.status")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{CompetitionStatuses.map((status) => (
														<SelectItem key={status} value={status}>
															{t(`status.${status}`)}
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
								name="sport"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.sport")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value ?? undefined}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{AthleteSports.map((sport) => (
														<SelectItem key={sport} value={sport}>
															{tc(`sports.${sport}`)}
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
								name="seasonId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.season")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value ?? undefined}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder={t("form.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{seasons?.map((season) => (
														<SelectItem key={season.id} value={season.id}>
															{season.name}
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

					<ProfileEditSection>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field className="flex flex-col">
											<FormLabel>{t("form.startDate")}</FormLabel>
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
															{field.value instanceof Date ? (
																format(field.value, "PPP", { locale: es })
															) : (
																<span>{t("form.selectDate")}</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={
															field.value instanceof Date
																? field.value
																: undefined
														}
														onSelect={field.onChange}
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
										<Field className="flex flex-col">
											<FormLabel>{t("form.endDate")}</FormLabel>
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
															{field.value instanceof Date ? (
																format(field.value, "PPP", { locale: es })
															) : (
																<span>{t("form.selectDate")}</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={
															field.value instanceof Date
																? field.value
																: undefined
														}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<FormField
							control={form.control}
							name="venue"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.venue")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("form.venuePlaceholder")}
												autoComplete="off"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											{t("form.venueDescription")}
										</FormDescription>
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
