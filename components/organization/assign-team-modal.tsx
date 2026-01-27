"use client";

import NiceModal from "@ebay/nice-modal-react";
import { ShieldIcon } from "lucide-react";
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
import { TeamMemberRole } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

const assignTeamSchema = z.object({
	teamId: z.string().min(1),
	role: z.string().default(TeamMemberRole.player),
	jerseyNumber: z.string().optional(),
	position: z.string().max(100).optional(),
});

interface AssignTeamModalProps {
	athleteId: string;
	existingTeamIds?: string[];
}

export const AssignTeamModal = NiceModal.create<AssignTeamModalProps>(
	({ athleteId, existingTeamIds = [] }) => {
		const t = useTranslations("athletes.teams");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const { data: activeTeams, isLoading: isLoadingTeams } =
			trpc.organization.team.listActive.useQuery();

		const availableTeams = (activeTeams ?? []).filter(
			(team) => !existingTeamIds.includes(team.id),
		);

		const form = useZodForm({
			schema: assignTeamSchema,
			defaultValues: {
				teamId: "",
				role: TeamMemberRole.player,
				jerseyNumber: "",
				position: "",
			},
		});

		const addMembersMutation = trpc.organization.team.addMembers.useMutation({
			onSuccess: () => {
				toast.success(t("assignSuccess"));
				utils.organization.team.listByAthlete.invalidate({
					athleteId,
				});
				utils.organization.athlete.getProfile.invalidate({
					id: athleteId,
				});
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			const jerseyNumber = data.jerseyNumber
				? Number.parseInt(data.jerseyNumber, 10)
				: undefined;

			addMembersMutation.mutate({
				teamId: data.teamId,
				members: [
					{
						athleteId,
						role: data.role as TeamMemberRole,
						jerseyNumber:
							jerseyNumber && !Number.isNaN(jerseyNumber)
								? jerseyNumber
								: undefined,
						position: data.position || undefined,
					},
				],
			});
		});

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("assignToTeam")}
				subtitle={t("assignSubtitle")}
				icon={<ShieldIcon className="size-5" />}
				accentColor="slate"
				form={form}
				onSubmit={onSubmit}
				isPending={addMembersMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
			>
				<div className="space-y-6">
					<ProfileEditSection title={t("teamSelection")}>
						<FormField
							control={form.control}
							name="teamId"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("team")}</FormLabel>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={isLoadingTeams}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder={t("selectTeam")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{availableTeams.map((team) => (
													<SelectItem key={team.id} value={team.id}>
														<span className="flex items-center gap-2">
															<span
																className="inline-block size-2.5 rounded-full"
																style={{
																	backgroundColor:
																		team.primaryColor ?? "#3B82F6",
																}}
															/>
															{team.name}
															{team.season && (
																<span className="text-muted-foreground">
																	({team.season.name})
																</span>
															)}
														</span>
													</SelectItem>
												))}
												{availableTeams.length === 0 && !isLoadingTeams && (
													<div className="px-2 py-4 text-center text-sm text-muted-foreground">
														{t("noAvailableTeams")}
													</div>
												)}
											</SelectContent>
										</Select>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</ProfileEditSection>

					<ProfileEditSection title={t("memberDetails")}>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>{t("role")}</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value={TeamMemberRole.player}>
													{t("player")}
												</SelectItem>
												<SelectItem value={TeamMemberRole.captain}>
													{t("captain")}
												</SelectItem>
												<SelectItem value={TeamMemberRole.viceCaptain}>
													{t("viceCaptain")}
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<ProfileEditGrid cols={2}>
							<FormField
								control={form.control}
								name="jerseyNumber"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("jerseyNumber")}</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder={t("jerseyNumberPlaceholder")}
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
								name="position"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("position")}</FormLabel>
											<FormControl>
												<Input
													placeholder={t("positionPlaceholder")}
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
