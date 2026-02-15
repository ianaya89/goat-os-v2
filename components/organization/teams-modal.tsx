"use client";

import NiceModal from "@ebay/nice-modal-react";
import { UsersIcon } from "lucide-react";
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
	FormDescription,
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
	type AthleteSport,
	AthleteSports,
	TeamStatus,
	TeamStatuses,
} from "@/lib/db/schema/enums";
import {
	createTeamSchema,
	updateTeamSchema,
} from "@/schemas/organization-team-schemas";
import { trpc } from "@/trpc/client";

interface Team {
	id: string;
	name: string;
	description: string | null;
	sport: string | null;
	status: string;
	seasonId?: string | null;
	ageCategoryId?: string | null;
	homeVenue?: string | null;
	primaryColor?: string | null;
	secondaryColor?: string | null;
}

interface TeamsModalProps {
	team?: Team;
}

export const TeamsModal = NiceModal.create<TeamsModalProps>(({ team }) => {
	const modal = useEnhancedModal();
	const t = useTranslations("teams");
	const tc = useTranslations("common");
	const isEditing = !!team;
	const utils = trpc.useUtils();

	const { data: seasons } = trpc.organization.season.listActive.useQuery();
	const { data: ageCategories } =
		trpc.organization.sportsEvent.listAgeCategories.useQuery({});

	const form = useZodForm({
		schema: isEditing ? updateTeamSchema : createTeamSchema,
		defaultValues: {
			id: team?.id,
			name: team?.name ?? "",
			description: team?.description ?? "",
			sport:
				(team?.sport as (typeof AthleteSport)[keyof typeof AthleteSport]) ??
				undefined,
			status:
				(team?.status as (typeof TeamStatus)[keyof typeof TeamStatus]) ??
				TeamStatus.active,
			seasonId: team?.seasonId ?? undefined,
			ageCategoryId: team?.ageCategoryId ?? undefined,
			homeVenue: team?.homeVenue ?? "",
			primaryColor: team?.primaryColor ?? "#3B82F6",
			secondaryColor: team?.secondaryColor ?? "#1E40AF",
		},
	});

	const createMutation = trpc.organization.team.create.useMutation({
		onSuccess: () => {
			toast.success(t("success.created"));
			utils.organization.team.list.invalidate();
			utils.organization.team.listActive.invalidate();
			modal.handleClose();
		},
		onError: (error) => {
			toast.error(error.message || t("error.createFailed"));
		},
	});

	const updateMutation = trpc.organization.team.update.useMutation({
		onSuccess: () => {
			toast.success(t("success.updated"));
			utils.organization.team.list.invalidate();
			utils.organization.team.listActive.invalidate();
			utils.organization.team.get.invalidate();
			modal.handleClose();
		},
		onError: (error) => {
			toast.error(error.message || t("error.updateFailed"));
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		const name = data.name || "";

		if (isEditing && team) {
			updateMutation.mutate({
				id: team.id,
				name,
				description: data.description,
				sport: data.sport,
				status: data.status,
				seasonId: data.seasonId,
				ageCategoryId: data.ageCategoryId,
				homeVenue: data.homeVenue,
				primaryColor: data.primaryColor,
				secondaryColor: data.secondaryColor,
			});
		} else {
			createMutation.mutate({
				name,
				description: data.description,
				sport: data.sport,
				status: data.status,
				seasonId: data.seasonId,
				ageCategoryId: data.ageCategoryId,
				homeVenue: data.homeVenue,
				primaryColor: data.primaryColor,
				secondaryColor: data.secondaryColor,
			});
		}
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<ProfileEditSheet
			open={modal.visible}
			onClose={modal.handleClose}
			title={isEditing ? t("modal.editTitle") : t("modal.createTitle")}
			subtitle={isEditing ? t("modal.editSubtitle") : t("modal.createSubtitle")}
			icon={<UsersIcon className="size-5" />}
			accentColor="primary"
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
											placeholder={t("modal.namePlaceholder")}
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
											placeholder={t("modal.descriptionPlaceholder")}
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
													<SelectValue placeholder={t("modal.select")} />
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
							name="status"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("table.status")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("modal.select")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{TeamStatuses.map((status) => (
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
													<SelectValue placeholder={t("modal.select")} />
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

						<FormField
							control={form.control}
							name="ageCategoryId"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.ageCategory")}</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value ?? undefined}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("modal.select")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ageCategories?.map((category) => (
													<SelectItem key={category.id} value={category.id}>
														{category.name}
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
						name="homeVenue"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FormLabel>{t("form.homeVenue")}</FormLabel>
									<FormControl>
										<Input
											placeholder={t("modal.homeVenuePlaceholder")}
											autoComplete="off"
											{...field}
											value={field.value ?? ""}
										/>
									</FormControl>
									<FormDescription>
										{t("modal.homeVenueDescription")}
									</FormDescription>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<ProfileEditGrid cols={2}>
						<FormField
							control={form.control}
							name="primaryColor"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.primaryColor")}</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<Input
													type="color"
													className="h-10 w-14 cursor-pointer p-1"
													{...field}
													value={field.value ?? "#3B82F6"}
												/>
												<Input
													placeholder="#3B82F6"
													{...field}
													value={field.value ?? "#3B82F6"}
												/>
											</div>
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="secondaryColor"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("form.secondaryColor")}</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<Input
													type="color"
													className="h-10 w-14 cursor-pointer p-1"
													{...field}
													value={field.value ?? "#1E40AF"}
												/>
												<Input
													placeholder="#1E40AF"
													{...field}
													value={field.value ?? "#1E40AF"}
												/>
											</div>
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
});
