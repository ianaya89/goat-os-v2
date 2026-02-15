"use client";

import NiceModal from "@ebay/nice-modal-react";
import { PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod/v4";
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { trpc } from "@/trpc/client";

const contactSchema = z.object({
	phone: z.string().trim().max(30).optional().nullable(),
	parentName: z.string().trim().max(200).optional().nullable(),
	parentRelationship: z.string().trim().max(100).optional().nullable(),
	parentPhone: z.string().trim().max(30).optional().nullable(),
	parentEmail: z.string().email().optional().or(z.literal("")).nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface OrgAthleteContactEditModalProps {
	athleteId: string;
	phone: string | null;
	parentName: string | null;
	parentRelationship: string | null;
	parentPhone: string | null;
	parentEmail: string | null;
}

export const OrgAthleteContactEditModal = NiceModal.create(
	({
		athleteId,
		phone,
		parentName,
		parentRelationship,
		parentPhone,
		parentEmail,
	}: OrgAthleteContactEditModalProps) => {
		const t = useTranslations("athletes");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const form = useZodForm({
			schema: contactSchema,
			defaultValues: {
				phone: phone ?? "",
				parentName: parentName ?? "",
				parentRelationship: parentRelationship ?? "",
				parentPhone: parentPhone ?? "",
				parentEmail: parentEmail ?? "",
			},
		});

		const updateMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data: ContactFormData) => {
			updateMutation.mutate({
				id: athleteId,
				phone: data.phone || null,
				parentName: data.parentName || null,
				parentRelationship: data.parentRelationship || null,
				parentPhone: data.parentPhone || null,
				parentEmail: data.parentEmail || null,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("info.editContact")}
				subtitle={t("editForm.parentContactOptional")}
				icon={<PhoneIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("editForm.athletePhone")}>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("info.phone")}</FormLabel>
										<FormControl>
											<Input
												placeholder="+54 11 1234-5678"
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

					<ProfileEditSection
						title={t("info.parentContact")}
						description={t("editForm.parentContactOptional")}
					>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="parentName"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("info.name")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("editForm.parentNamePlaceholder")}
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
								name="parentRelationship"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("info.relationship")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue
															placeholder={t("editForm.selectRelationship")}
														/>
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="mother">
														{t("editForm.mother")}
													</SelectItem>
													<SelectItem value="father">
														{t("editForm.father")}
													</SelectItem>
													<SelectItem value="guardian">
														{t("editForm.guardian")}
													</SelectItem>
													<SelectItem value="grandparent">
														{t("editForm.grandparent")}
													</SelectItem>
													<SelectItem value="other">
														{t("editForm.other")}
													</SelectItem>
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
								name="parentPhone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("editForm.phone")}</FormLabel>
											<FormControl>
												<Input
													placeholder="+54 11 1234-5678"
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
								name="parentEmail"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="email@ejemplo.com"
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
				</div>
			</ProfileEditSheet>
		);
	},
);
