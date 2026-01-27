"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CheckIcon, UserIcon, XIcon } from "lucide-react";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface SessionCoachesEditModalProps {
	sessionId: string;
	currentCoachIds: string[];
	currentPrimaryCoachId: string | null;
}

export const SessionCoachesEditModal = NiceModal.create(
	({
		sessionId,
		currentCoachIds,
		currentPrimaryCoachId,
	}: SessionCoachesEditModalProps) => {
		const t = useTranslations("training");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const [selectedCoachIds, setSelectedCoachIds] =
			React.useState<string[]>(currentCoachIds);
		const [primaryCoachId, setPrimaryCoachId] = React.useState<string | null>(
			currentPrimaryCoachId,
		);
		const [popoverOpen, setPopoverOpen] = React.useState(false);

		const { data: coachesData } = trpc.organization.coach.list.useQuery({
			limit: 100,
			offset: 0,
		});
		const coaches = coachesData?.coaches ?? [];

		const updateCoachesMutation =
			trpc.organization.trainingSession.updateCoaches.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.trainingSession.get.invalidate({
						id: sessionId,
					});
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateCoachesFailed"));
				},
			});

		const toggleCoach = (coachId: string) => {
			setSelectedCoachIds((prev) => {
				if (prev.includes(coachId)) {
					if (primaryCoachId === coachId) {
						setPrimaryCoachId(null);
					}
					return prev.filter((id) => id !== coachId);
				}
				return [...prev, coachId];
			});
		};

		const handleSubmit = () => {
			updateCoachesMutation.mutate({
				sessionId,
				coachIds: selectedCoachIds,
				primaryCoachId: primaryCoachId ?? undefined,
			});
		};

		const selectedCoaches = coaches.filter((c) =>
			selectedCoachIds.includes(c.id),
		);

		return (
			<ProfileEditSheet
				open={modal.visible}
				onClose={modal.handleClose}
				title={t("modal.editCoachesTitle")}
				subtitle={t("modal.editCoachesSubtitle")}
				icon={<UserIcon className="size-5" />}
				accentColor="slate"
				isPending={updateCoachesMutation.isPending}
				maxWidth="md"
				onAnimationEndCapture={modal.handleAnimationEndCapture}
				customFooter={
					<div className="flex justify-end gap-3 border-t bg-muted/30 px-6 py-4">
						<Button
							type="button"
							variant="ghost"
							onClick={modal.handleClose}
							disabled={updateCoachesMutation.isPending}
							className="min-w-[100px]"
						>
							<XIcon className="size-4" />
							{t("modal.cancelButton")}
						</Button>
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={updateCoachesMutation.isPending}
							loading={updateCoachesMutation.isPending}
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
						<Field>
							<Label>{t("modal.coaches")}</Label>
							<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-start font-normal"
									>
										{selectedCoachIds.length > 0
											? t("modal.coachesSelected", {
													count: selectedCoachIds.length,
												})
											: t("modal.selectCoaches")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-[300px] p-0" align="start">
									<Command>
										<CommandInput placeholder={t("modal.searchCoaches")} />
										<CommandList>
											{coaches.length === 0 ? (
												<div className="px-4 py-6 text-center text-muted-foreground text-sm">
													{t("modal.noCoachesAvailable")}
												</div>
											) : (
												<>
													<CommandEmpty>
														{t("modal.noCoachesFound")}
													</CommandEmpty>
													<CommandGroup>
														{coaches.map((coach) => {
															const isSelected = selectedCoachIds.includes(
																coach.id,
															);
															return (
																<CommandItem
																	key={coach.id}
																	value={coach.user?.name ?? coach.id}
																	onSelect={() => toggleCoach(coach.id)}
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
																			name={coach.user?.name ?? ""}
																			src={coach.user?.image ?? undefined}
																		/>
																		<span className="truncate">
																			{coach.user?.name ?? "Unknown"}
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

							{selectedCoaches.length > 0 && (
								<div className="mt-2 space-y-2">
									{selectedCoaches.map((coach) => (
										<div
											key={coach.id}
											className="flex items-center justify-between rounded-md border px-3 py-2"
										>
											<div className="flex items-center gap-2">
												<UserAvatar
													className="size-6"
													name={coach.user?.name ?? ""}
													src={coach.user?.image ?? undefined}
												/>
												<span className="text-sm">
													{coach.user?.name ?? "Unknown"}
												</span>
												{primaryCoachId === coach.id && (
													<Badge variant="secondary" className="text-xs">
														{t("modal.primary")}
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-1">
												{primaryCoachId !== coach.id && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setPrimaryCoachId(coach.id)}
													>
														{t("modal.setPrimary")}
													</Button>
												)}
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="size-6"
													onClick={() => toggleCoach(coach.id)}
												>
													<XIcon className="size-4" />
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</Field>
					</ProfileEditSection>
				</div>
			</ProfileEditSheet>
		);
	},
);
