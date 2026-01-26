"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { type AthleteSport, AthleteSports } from "@/lib/db/schema/enums";
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

interface SelectedAthlete {
	id: string;
	name: string;
	image: string | null;
}

export type AthleteGroupsModalProps = NiceModalHocProps & {
	group?: {
		id: string;
		name: string;
		description?: string | null;
		sport?: AthleteSport | null;
		ageCategoryId?: string | null;
		maxCapacity?: number | null;
		isActive: boolean;
		members: GroupMember[];
	};
};

export const AthleteGroupsModal = NiceModal.create<AthleteGroupsModalProps>(
	({ group }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!group;

		// Store selected athletes with their data for display
		const [selectedAthletes, setSelectedAthletes] = React.useState<
			SelectedAthlete[]
		>(
			() =>
				group?.members.map((m) => ({
					id: m.athlete.id,
					name: m.athlete.user?.name ?? "Unknown",
					image: m.athlete.user?.image ?? null,
				})) ?? [],
		);

		const [popoverOpen, setPopoverOpen] = React.useState(false);
		const [searchQuery, setSearchQuery] = React.useState("");
		const [debouncedQuery, setDebouncedQuery] = React.useState("");
		const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

		// Debounce search query
		React.useEffect(() => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			debounceTimeoutRef.current = setTimeout(() => {
				setDebouncedQuery(searchQuery);
			}, 300);

			return () => {
				if (debounceTimeoutRef.current) {
					clearTimeout(debounceTimeoutRef.current);
				}
			};
		}, [searchQuery]);

		// Only search when there's a query with at least 2 characters
		const shouldSearch = debouncedQuery.length >= 2;

		const { data: searchResults, isFetching: isSearching } =
			trpc.organization.athlete.list.useQuery(
				{
					limit: 20,
					offset: 0,
					query: debouncedQuery,
				},
				{
					enabled: shouldSearch,
					staleTime: 10000,
				},
			);

		const athletes = searchResults?.athletes ?? [];

		// Get age categories for selection
		const { data: ageCategories } =
			trpc.organization.sportsEvent.listAgeCategories.useQuery(
				{ includeInactive: false },
				{ staleTime: 60000 },
			);

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
						sport: group.sport ?? null,
						ageCategoryId: group.ageCategoryId ?? null,
						maxCapacity: group.maxCapacity ?? null,
						isActive: group.isActive,
					}
				: {
						name: "",
						description: "",
						sport: null,
						ageCategoryId: null,
						maxCapacity: null,
						isActive: true,
						memberIds: [],
					},
		});

		const onSubmit = form.handleSubmit(async (data) => {
			const selectedIds = selectedAthletes.map((a) => a.id);
			if (isEditing) {
				// Update group info
				await updateGroupMutation.mutateAsync(
					data as Parameters<typeof updateGroupMutation.mutateAsync>[0],
				);
				// Update members
				await setMembersMutation.mutateAsync({
					groupId: group.id,
					athleteIds: selectedIds,
				});
			} else {
				createGroupMutation.mutate({
					...(data as Parameters<typeof createGroupMutation.mutate>[0]),
					memberIds: selectedIds,
				});
			}
		});

		const isPending =
			createGroupMutation.isPending ||
			updateGroupMutation.isPending ||
			setMembersMutation.isPending;

		const toggleAthlete = (athlete: {
			id: string;
			user: { name: string; image: string | null } | null;
		}) => {
			setSelectedAthletes((prev) => {
				const isSelected = prev.some((a) => a.id === athlete.id);
				if (isSelected) {
					return prev.filter((a) => a.id !== athlete.id);
				}
				return [
					...prev,
					{
						id: athlete.id,
						name: athlete.user?.name ?? "Unknown",
						image: athlete.user?.image ?? null,
					},
				];
			});
		};

		const removeAthlete = (athleteId: string) => {
			setSelectedAthletes((prev) => prev.filter((a) => a.id !== athleteId));
		};

		const selectedAthleteIds = selectedAthletes.map((a) => a.id);

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
						<SheetTitle>{isEditing ? "Edit Group" : "Create Group"}</SheetTitle>
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

									<FormField
										control={form.control}
										name="sport"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Sport</FormLabel>
													<Select
														value={field.value ?? ""}
														onValueChange={(value) =>
															field.onChange(value || null)
														}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Select sport" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{AthleteSports.map((sport) => (
																<SelectItem key={sport} value={sport}>
																	{sport.charAt(0).toUpperCase() +
																		sport.slice(1).replace(/_/g, " ")}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="ageCategoryId"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Age Category</FormLabel>
														<Select
															value={field.value ?? ""}
															onValueChange={(value) =>
																field.onChange(value || null)
															}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select category" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{ageCategories?.map((category) => (
																	<SelectItem
																		key={category.id}
																		value={category.id}
																	>
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

										<FormField
											control={form.control}
											name="maxCapacity"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>Max Capacity</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={1}
																placeholder="Unlimited"
																{...field}
																value={field.value ?? ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value
																			? Number.parseInt(e.target.value, 10)
																			: null,
																	)
																}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									</div>

									<Field>
										<FormLabel>Members</FormLabel>
										<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="w-full justify-start font-normal"
												>
													<SearchIcon className="mr-2 size-4 text-muted-foreground" />
													{selectedAthletes.length > 0
														? `${selectedAthletes.length} athlete${selectedAthletes.length > 1 ? "s" : ""} selected`
														: "Search and select athletes..."}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-[300px] p-0" align="start">
												<Command shouldFilter={false}>
													<CommandInput
														placeholder="Search athletes..."
														value={searchQuery}
														onValueChange={setSearchQuery}
													/>
													<CommandList>
														{!shouldSearch && (
															<div className="py-6 text-center text-sm text-muted-foreground">
																Type at least 2 characters to search
															</div>
														)}
														{shouldSearch && isSearching && (
															<div className="flex items-center justify-center py-6">
																<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
															</div>
														)}
														{shouldSearch &&
															!isSearching &&
															athletes.length === 0 && (
																<CommandEmpty>No athletes found.</CommandEmpty>
															)}
														{shouldSearch &&
															!isSearching &&
															athletes.length > 0 && (
																<CommandGroup>
																	{athletes.map((athlete) => {
																		const isSelected =
																			selectedAthleteIds.includes(athlete.id);
																		return (
																			<CommandItem
																				key={athlete.id}
																				value={athlete.id}
																				onSelect={() => toggleAthlete(athlete)}
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
																						src={
																							athlete.user?.image ?? undefined
																						}
																					/>
																					<span className="truncate">
																						{athlete.user?.name ?? "Unknown"}
																					</span>
																				</div>
																			</CommandItem>
																		);
																	})}
																</CommandGroup>
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
														{athlete.name}
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
