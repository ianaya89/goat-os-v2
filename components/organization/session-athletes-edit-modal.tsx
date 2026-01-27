"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CheckIcon, UsersIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
	ProfileEditSection,
	ProfileEditSheet,
} from "@/components/athlete/profile-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionAthletesEditModalProps {
	sessionId: string;
	currentAthleteIds: string[];
	currentGroupId: string | null;
}

export const SessionAthletesEditModal = NiceModal.create(
	({
		sessionId,
		currentAthleteIds,
		currentGroupId,
	}: SessionAthletesEditModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const [assignmentType, setAssignmentType] = React.useState<
			"group" | "athletes"
		>(currentGroupId ? "group" : "athletes");
		const [selectedAthleteIds, setSelectedAthleteIds] =
			React.useState<string[]>(currentAthleteIds);
		const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
			currentGroupId,
		);
		const [popoverOpen, setPopoverOpen] = React.useState(false);

		const { data: athletesData } = trpc.organization.athlete.list.useQuery({
			limit: 100,
			offset: 0,
		});
		const { data: groupsData } =
			trpc.organization.athleteGroup.listActive.useQuery();

		const athletes = athletesData?.athletes ?? [];
		const groups = groupsData ?? [];

		const updateAthletesMutation =
			trpc.organization.trainingSession.updateAthletes.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingSession.get.invalidate({
						id: sessionId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateAthletesFailed"));
				},
			});

		const updateSessionMutation =
			trpc.organization.trainingSession.update.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingSession.get.invalidate({
						id: sessionId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			});

		const toggleAthlete = (athleteId: string) => {
			setSelectedAthleteIds((prev) =>
				prev.includes(athleteId)
					? prev.filter((id) => id !== athleteId)
					: [...prev, athleteId],
			);
		};

		const handleSubmit = async () => {
			if (assignmentType === "athletes") {
				updateAthletesMutation.mutate({
					sessionId,
					athleteIds: selectedAthleteIds,
				});
			} else {
				updateSessionMutation.mutate({
					id: sessionId,
					athleteGroupId: selectedGroupId,
				});
			}
		};

		const isPending =
			updateAthletesMutation.isPending || updateSessionMutation.isPending;

		const selectedAthletes = athletes.filter((a) =>
			selectedAthleteIds.includes(a.id),
		);

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.editAthletesTitle")}
				subtitle={t("modal.editAthletesSubtitle")}
				icon={<UsersIcon className="size-5" />}
				accentColor="slate"
				isPending={isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex justify-end gap-3 border-t bg-muted/30 px-6 py-4">
						<Button
							type="button"
							variant="ghost"
							onClick={modal.handleClose}
							disabled={isPending}
							className="min-w-[100px]"
						>
							<XIcon className="size-4" />
							{t("modal.cancelButton")}
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={isPending}
							loading={isPending}
							className="min-w-[100px]"
						>
							<CheckIcon className="size-4" />
							{t("modal.updateSession")}
						</Button>
					</div>
				}
			>
				<div className="space-y-6">
					<ProfileEditSection>
						{/* Assignment type toggle */}
						<Field>
							<Label>{t("modal.assignAthletesBy")}</Label>
							<Select
								value={assignmentType}
								onValueChange={(value: "group" | "athletes") =>
									setAssignmentType(value)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="group">
										{t("modal.athleteGroup")}
									</SelectItem>
									<SelectItem value="athletes">
										{t("modal.individualAthletes")}
									</SelectItem>
								</SelectContent>
							</Select>
						</Field>

						{assignmentType === "group" ? (
							<Field>
								<Label>{t("modal.athleteGroup")}</Label>
								<Select
									onValueChange={(value) =>
										setSelectedGroupId(value === "none" ? null : value)
									}
									value={selectedGroupId ?? "none"}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder={t("modal.selectGroup")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("modal.noGroup")}</SelectItem>
										{groups.map((group) => (
											<SelectItem key={group.id} value={group.id}>
												{group.name} ({group.memberCount} {t("modal.members")})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						) : (
							<Field>
								<Label>{t("form.athletes")}</Label>
								<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start font-normal"
										>
											{selectedAthleteIds.length > 0
												? t("table.athleteCount", {
														count: selectedAthleteIds.length,
													})
												: t("modal.selectAthletes")}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-[300px] p-0" align="start">
										<Command>
											<CommandInput placeholder={t("modal.searchAthletes")} />
											<CommandList>
												{athletes.length === 0 ? (
													<div className="px-4 py-6 text-center text-muted-foreground text-sm">
														{t("modal.noAthletesAvailable")}
													</div>
												) : (
													<>
														<CommandEmpty>
															{t("modal.noAthletesFound")}
														</CommandEmpty>
														<CommandGroup>
															{athletes.map((athlete) => {
																const isSelected = selectedAthleteIds.includes(
																	athlete.id,
																);
																return (
																	<CommandItem
																		key={athlete.id}
																		value={athlete.user?.name ?? athlete.id}
																		onSelect={() => toggleAthlete(athlete.id)}
																	>
																		<div className="flex items-center gap-2">
																			<div
																				className={cn(
																					"flex size-4 items-center justify-center rounded-sm border",
																					isSelected
																						? "border-primary bg-primary text-primary-foreground"
																						: "border-muted-foreground",
																				)}
																			>
																				{isSelected && (
																					<CheckIcon className="size-3" />
																				)}
																			</div>
																			<UserAvatar
																				className="size-6"
																				name={athlete.user?.name ?? ""}
																				src={athlete.user?.image ?? undefined}
																			/>
																			<span className="truncate">
																				{athlete.user?.name ?? "Unknown"}
																			</span>
																		</div>
																	</CommandItem>
																);
															})}
														</CommandGroup>
													</>
												)}
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>

								{selectedAthletes.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{selectedAthletes.map((athlete) => (
											<Badge
												key={athlete.id}
												variant="secondary"
												className="gap-1"
											>
												{athlete.user?.name ?? "Unknown"}
												<button
													type="button"
													onClick={() => toggleAthlete(athlete.id)}
													className="ml-1 rounded-full hover:bg-muted-foreground/20"
												>
													<XIcon className="size-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</Field>
						)}
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
