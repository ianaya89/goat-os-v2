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
	parentName: z.string().trim().max(100).optional().nullable(),
	parentRelationship: z.string().optional().nullable(),
	parentPhone: z.string().trim().max(30).optional().nullable(),
	parentEmail: z.string().email().optional().or(z.literal("")).nullable(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface AthleteContactEditModalProps {
	phone: string | null;
	parentName: string | null;
	parentRelationship: string | null;
	parentPhone: string | null;
	parentEmail: string | null;
}

export const AthleteContactEditModal = NiceModal.create(
	({
		phone,
		parentName,
		parentRelationship,
		parentPhone,
		parentEmail,
	}: AthleteContactEditModalProps) => {
		const modal = useEnhancedModal();
		const t = useTranslations("myProfile");
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

		const updateMutation = trpc.athlete.updateMyProfile.useMutation({
			onSuccess: () => {
				toast.success(t("contactModal.success"));
				utils.athlete.getMyProfile.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("common.updateError"));
			},
		});

		const onSubmit = form.handleSubmit((data: ContactFormData) => {
			updateMutation.mutate({
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
				title={t("contactModal.title")}
				subtitle={t("contactModal.subtitle")}
				icon={<PhoneIcon className="size-5" />}
				accentColor="primary"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("contactModal.myContact")}>
						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Telefono</FormLabel>
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
						title="Contacto de Padre/Tutor"
						description="Informacion de contacto de emergencia"
					>
						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="parentName"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("contactModal.parentName")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("contactModal.parentNamePlaceholder")}
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
											<FormLabel>{t("contactModal.relationship")}</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value ?? ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t("common.select")} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="mother">
														{t("contactModal.mother")}
													</SelectItem>
													<SelectItem value="father">
														{t("contactModal.father")}
													</SelectItem>
													<SelectItem value="guardian">
														{t("contactModal.guardian")}
													</SelectItem>
													<SelectItem value="other">
														{t("contactModal.other")}
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
											<FormLabel>Telefono</FormLabel>
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
											<FormLabel>{t("contactModal.parentEmail")}</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder={t("contactModal.parentEmailPlaceholder")}
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
