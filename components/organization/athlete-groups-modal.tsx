"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, XIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import {
	Form,
	FormControl,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import {
	createAthleteGroupSchema,
	updateAthleteGroupSchema,
} from "@/schemas/organization-athlete-group-schemas";
import { trpc } from "@/trpc/client";

interface GroupMember {
	id: string;
	athlete: {
		id: string;
		user: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
	};
}

export type AthleteGroupsModalProps = NiceModalHocProps & {
	group?: {
		id: string;
		name: string;
		description?: string | null;
		isActive: boolean;
		members: GroupMember[];
	};
};

export const AthleteGroupsModal = NiceModal.create<AthleteGroupsModalProps>(
	({ group }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!group;
		const [selectedAthleteIds, setSelectedAthleteIds] = React.useState<
			string[]
		>(group?.members.map((m) => m.athlete.id) ?? []);
		const [popoverOpen, setPopoverOpen] = React.useState(false);

		// Get all athletes for selection
		const { data: athletesData } = trpc.organization.athlete.list.useQuery(
			{
				limit: 500,
				offset: 0,
				filters: { status: ["active"] },
			},
			{
				staleTime: 30000,
			},
		);

		const athletes = athletesData?.athletes ?? [];

		const createGroupMutation =
			trpc.organization.athleteGroup.create.useMutation({
				onSuccess: () => {
					toast.success("Group created successfully");
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to create group");
				},
			});

		const updateGroupMutation =
			trpc.organization.athleteGroup.update.useMutation({
				onSuccess: () => {
					toast.success("Group updated successfully");
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update group");
				},
			});

		const setMembersMutation =
			trpc.organization.athleteGroup.setMembers.useMutation({
				onSuccess: () => {
					utils.organization.athleteGroup.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update members");
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateAthleteGroupSchema : createAthleteGroupSchema,
			defaultValues: isEditing
				? {
						id: group.id,
						name: group.name,
						description: group.description ?? "",
						isActive: group.isActive,
					}
				: {
						name: "",
						description: "",
						isActive: true,
						memberIds: [],
					},
		});

		const onSubmit = form.handleSubmit(async (data) => {
			if (isEditing) {
				// Update group info
				await updateGroupMutation.mutateAsync(
					data as Parameters<typeof updateGroupMutation.mutateAsync>[0],
				);
				// Update members
				await setMembersMutation.mutateAsync({
					groupId: group.id,
					athleteIds: selectedAthleteIds,
				});
			} else {
				createGroupMutation.mutate({
					...(data as Parameters<typeof createGroupMutation.mutate>[0]),
					memberIds: selectedAthleteIds,
				});
			}
		});

		const isPending =
			createGroupMutation.isPending ||
			updateGroupMutation.isPending ||
			setMembersMutation.isPending;

		const toggleAthlete = (athleteId: string) => {
			setSelectedAthleteIds((prev) =>
				prev.includes(athleteId)
					? prev.filter((id) => id !== athleteId)
					: [...prev, athleteId],
			);
		};

		const removeAthlete = (athleteId: string) => {
			setSelectedAthleteIds((prev) => prev.filter((id) => id !== athleteId));
		};

		const selectedAthletes = athletes.filter((a) =>
			selectedAthleteIds.includes(a.id),
		);

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Edit Group" : "Create Group"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the group information below."
								: "Fill in the details to create a new group."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g., Junior Team"
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
													<FormLabel>Description</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Description of the group..."
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

									<Field>
										<FormLabel>Members</FormLabel>
										<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="w-full justify-start font-normal"
												>
													{selectedAthleteIds.length > 0
														? `${selectedAthleteIds.length} athlete${selectedAthleteIds.length > 1 ? "s" : ""} selected`
														: "Select athletes..."}
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-[300px] p-0"
												align="start"
											>
												<Command>
													<CommandInput placeholder="Search athletes..." />
													<CommandList>
														<CommandEmpty>No athletes found.</CommandEmpty>
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
															onClick={() => removeAthlete(athlete.id)}
															className="ml-1 rounded-full hover:bg-muted-foreground/20"
														>
															<XIcon className="size-3" />
														</button>
													</Badge>
												))}
											</div>
										)}
									</Field>

									<FormField
										control={form.control}
										name="isActive"
										render={({ field }) => (
											<FormItem asChild>
												<Field className="flex-row items-center justify-between">
													<FormLabel>Active</FormLabel>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isPending} loading={isPending}>
									{isEditing ? "Update Group" : "Create Group"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
