"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { HeartHandshakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	ProfileEditGrid,
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
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
	type EventSponsorTier,
	EventSponsorTiers,
	type SponsorStatus,
	SponsorStatuses,
} from "@/lib/db/schema/enums";
import {
	createSponsorOrgSchema,
	updateSponsorOrgSchema,
} from "@/schemas/organization-sponsor-schemas";
import { trpc } from "@/trpc/client";

export type SponsorsModalProps = NiceModalHocProps & {
	sponsor?: {
		id: string;
		name: string;
		description?: string | null;
		logoUrl?: string | null;
		websiteUrl?: string | null;
		contactName?: string | null;
		contactEmail?: string | null;
		contactPhone?: string | null;
		tier: EventSponsorTier;
		contractStartDate?: Date | null;
		contractEndDate?: Date | null;
		contractValue?: number | null;
		currency: string;
		contractNotes?: string | null;
		status: SponsorStatus;
		notes?: string | null;
		isActive: boolean;
	};
};

export const SponsorsModal = NiceModal.create<SponsorsModalProps>(
	({ sponsor }) => {
		const modal = useEnhancedModal();
		const t = useTranslations("sponsors");
		const utils = trpc.useUtils();
		const isEditing = !!sponsor;

		const createSponsorMutation = trpc.organization.sponsor.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.created"));
				utils.organization.sponsor.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateSponsorMutation = trpc.organization.sponsor.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.sponsor.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateSponsorOrgSchema : createSponsorOrgSchema,
			defaultValues: isEditing
				? {
						id: sponsor.id,
						name: sponsor.name,
						description: sponsor.description ?? "",
						logoUrl: sponsor.logoUrl ?? "",
						websiteUrl: sponsor.websiteUrl ?? "",
						contactName: sponsor.contactName ?? "",
						contactEmail: sponsor.contactEmail ?? "",
						contactPhone: sponsor.contactPhone ?? "",
						tier: sponsor.tier,
						contractStartDate: sponsor.contractStartDate ?? undefined,
						contractEndDate: sponsor.contractEndDate ?? undefined,
						contractValue: sponsor.contractValue ?? undefined,
						currency: sponsor.currency,
						contractNotes: sponsor.contractNotes ?? "",
						status: sponsor.status,
						notes: sponsor.notes ?? "",
						isActive: sponsor.isActive,
					}
				: {
						name: "",
						description: "",
						contactName: "",
						contactEmail: "",
						contactPhone: "",
						tier: "partner" as EventSponsorTier,
						status: "pending" as SponsorStatus,
						currency: "ARS",
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateSponsorMutation.mutate(
					data as Parameters<typeof updateSponsorMutation.mutate>[0],
				);
			} else {
				createSponsorMutation.mutate(
					data as Parameters<typeof createSponsorMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createSponsorMutation.isPending || updateSponsorMutation.isPending;

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
				subtitle={
					isEditing ? t("modal.editSubtitle") : t("modal.createSubtitle")
				}
				icon={<HeartHandshakeIcon className="size-5" />}
				accentColor="rose"
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
										<FormLabel>{t("form.name")} *</FormLabel>
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

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="tier"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.tier")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue
															placeholder={t("form.tierPlaceholder")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{EventSponsorTiers.map((tier) => (
														<SelectItem key={tier} value={tier}>
															{t(`tier.${tier}`)}
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
												value={field.value}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue
															placeholder={t("form.statusPlaceholder")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{SponsorStatuses.map((status) => (
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
					</ProfileEditSection>

					<ProfileEditSection>
						<FormField
							control={form.control}
							name="contactName"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.contactName")}</FormLabel>
										<FormControl>
											<Input
												placeholder={t("form.contactNamePlaceholder")}
												autoComplete="off"
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
								name="contactEmail"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.contactEmail")}</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder={t("form.contactEmailPlaceholder")}
													autoComplete="off"
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
								name="contactPhone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.contactPhone")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("form.contactPhonePlaceholder")}
													autoComplete="off"
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

					<ProfileEditSection title={t("form.contractSection")}>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="contractStartDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.contractStartDate")}</FormLabel>
											<FormControl>
												<Input
													type="date"
													{...field}
													value={
														field.value instanceof Date
															? field.value.toISOString().split("T")[0]
															: ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? new Date(e.target.value)
																: undefined,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="contractEndDate"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("form.contractEndDate")}</FormLabel>
											<FormControl>
												<Input
													type="date"
													{...field}
													value={
														field.value instanceof Date
															? field.value.toISOString().split("T")[0]
															: ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? new Date(e.target.value)
																: undefined,
														)
													}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</ProfileEditGrid>

						<FormField
							control={form.control}
							name="contractValue"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.contractValue")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="0"
												{...field}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? parseInt(e.target.value, 10)
															: undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="contractNotes"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.contractNotes")}</FormLabel>
										<FormControl>
											<Textarea
												placeholder={t("form.contractNotesPlaceholder")}
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

					<ProfileEditSection>
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
