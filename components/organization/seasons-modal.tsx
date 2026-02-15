"use client";

import NiceModal from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
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
import { Switch } from "@/components/ui/switch";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import {
	createSeasonSchema,
	updateSeasonSchema,
} from "@/schemas/organization-season-schemas";
import { trpc } from "@/trpc/client";

interface Season {
	id: string;
	name: string;
	startDate: Date;
	endDate: Date;
	isActive: boolean;
	isCurrent: boolean;
}

interface SeasonsModalProps {
	season?: Season;
}

export const SeasonsModal = NiceModal.create<SeasonsModalProps>(
	({ season }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("seasons");
		const isEditing = !!season;
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: isEditing ? updateSeasonSchema : createSeasonSchema,
			defaultValues: {
				id: season?.id,
				name: season?.name ?? "",
				startDate: season?.startDate ? new Date(season.startDate) : new Date(),
				endDate: season?.endDate ? new Date(season.endDate) : new Date(),
				isActive: season?.isActive ?? true,
				isCurrent: season?.isCurrent ?? false,
			},
		});

		const createMutation = trpc.organization.season.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.created"));
				utils.organization.season.list.invalidate();
				utils.organization.season.listActive.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateMutation = trpc.organization.season.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.season.list.invalidate();
				utils.organization.season.listActive.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const name = data.name || "";
			const startDate = data.startDate as Date;
			const endDate = data.endDate as Date;

			if (isEditing && season) {
				updateMutation.mutate({
					id: season.id,
					name,
					startDate,
					endDate,
					isActive: data.isActive,
					isCurrent: data.isCurrent,
				});
			} else {
				createMutation.mutate({
					name,
					startDate,
					endDate,
					isActive: data.isActive,
					isCurrent: data.isCurrent,
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
				icon={<CalendarIcon className="size-5" />}
				accentColor="emerald"
				form={form}
				onSubmit={onSubmit}
				isPending={isPending}
				submitLabel={isEditing ? t("modal.update") : t("modal.create")}
				cancelLabel={t("modal.cancel")}
				maxWidth="md"
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
										<FormDescription>
											{t("form.nameDescription")}
										</FormDescription>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => {
								const dateValue =
									field.value instanceof Date ? field.value : undefined;
								return (
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
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP", { locale: es })
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
														selected={dateValue}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</Field>
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="endDate"
							render={({ field }) => {
								const dateValue =
									field.value instanceof Date ? field.value : undefined;
								return (
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
																!dateValue && "text-muted-foreground",
															)}
														>
															{dateValue ? (
																format(dateValue, "PPP", { locale: es })
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
														selected={dateValue}
														onSelect={field.onChange}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</Field>
									</FormItem>
								);
							}}
						/>
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("form.isActive")}
										</FormLabel>
										<FormDescription>
											{t("form.isActiveDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isCurrent"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											{t("form.isCurrent")}
										</FormLabel>
										<FormDescription>
											{t("form.isCurrentDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
