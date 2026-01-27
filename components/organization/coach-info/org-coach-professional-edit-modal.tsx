"use client";

import NiceModal from "@ebay/nice-modal-react";
import { BriefcaseIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import {
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SportSelect } from "@/components/ui/sport-select";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { AthleteSport, CoachStatus } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const professionalSchema = z.object({
	sport: z.nativeEnum(AthleteSport).optional(),
	specialty: z
		.string()
		.trim()
		.min(1, "Specialty is required")
		.max(500, "Specialty is too long"),
	status: z.nativeEnum(CoachStatus).optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

interface OrgCoachProfessionalEditModalProps {
	coachId: string;
	sport: string | null;
	specialty: string;
	status: string;
}

export const OrgCoachProfessionalEditModal = NiceModal.create(
	({
		coachId,
		sport,
		specialty,
		status,
	}: OrgCoachProfessionalEditModalProps) => {
		const t = useTranslations("coaches");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const [specialtyInput, setSpecialtyInput] = React.useState("");

		const form = useZodForm({
			schema: professionalSchema,
			defaultValues: {
				sport: (sport as AthleteSport) ?? undefined,
				specialty,
				status: (status as CoachStatus) ?? CoachStatus.active,
			},
		});

		const specialtyValue = form.watch("specialty") ?? "";
		const specialtyTags = React.useMemo(() => {
			if (!specialtyValue) return [];
			return specialtyValue
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);
		}, [specialtyValue]);

		const addTag = (tag: string) => {
			const trimmed = tag.trim();
			if (!trimmed) return;
			if (specialtyTags.some((t) => t.toLowerCase() === trimmed.toLowerCase()))
				return;
			const newValue = [...specialtyTags, trimmed].join(", ");
			form.setValue("specialty", newValue, { shouldValidate: true });
			setSpecialtyInput("");
		};

		const removeTag = (index: number) => {
			const newTags = specialtyTags.filter((_, i) => i !== index);
			form.setValue("specialty", newTags.join(", "), {
				shouldValidate: true,
			});
		};

		const handleSpecialtyKeyDown = (
			e: React.KeyboardEvent<HTMLInputElement>,
		) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				addTag(specialtyInput);
			}
			if (
				e.key === "Backspace" &&
				!specialtyInput &&
				specialtyTags.length > 0
			) {
				removeTag(specialtyTags.length - 1);
			}
		};

		const translateStatus = (s: string) => {
			return t(`statuses.${s}` as Parameters<typeof t>[0]);
		};

		const updateMutation = trpc.organization.coach.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.coach.getProfile.invalidate({ id: coachId });
				utils.organization.coach.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data: ProfessionalFormData) => {
			updateMutation.mutate({
				id: coachId,
				sport: data.sport,
				specialty: data.specialty,
				status: data.status,
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("profile.info.editProfessional")}
				subtitle={t("profile.info.editProfessionalSubtitle")}
				icon={<BriefcaseIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={updateMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						<FormField
							control={form.control}
							name="sport"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("profile.info.sport")}</FormLabel>
										<FormControl>
											<SportSelect
												value={field.value ?? null}
												onValueChange={(val) =>
													field.onChange(val ?? undefined)
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
							name="specialty"
							render={() => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("profile.info.specialty")}</FormLabel>
										<div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
											{specialtyTags.map((tag, index) => (
												<Badge
													key={`${tag}-${index}`}
													variant="secondary"
													className="gap-1 pr-1"
												>
													{tag}
													<button
														type="button"
														onClick={() => removeTag(index)}
														className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
													>
														<XIcon className="size-3" />
													</button>
												</Badge>
											))}
											<input
												type="text"
												value={specialtyInput}
												onChange={(e) => setSpecialtyInput(e.target.value)}
												onKeyDown={handleSpecialtyKeyDown}
												onBlur={() => {
													if (specialtyInput.trim()) {
														addTag(specialtyInput);
													}
												}}
												placeholder={
													specialtyTags.length === 0
														? t("modal.specialtyPlaceholder")
														: ""
												}
												className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
											/>
										</div>
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
										<FormLabel>{t("profile.info.status")}</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("modal.selectStatus")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(CoachStatus).map((s) => (
													<SelectItem key={s} value={s}>
														{translateStatus(s)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
