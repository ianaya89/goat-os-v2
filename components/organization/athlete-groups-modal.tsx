"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckIcon,
	Loader2Icon,
	PlusIcon,
	SearchIcon,
	Users2Icon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { SportSelect } from "@/components/ui/sport-select";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import type { AthleteSport } from "@/lib/db/schema/enums";
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
		const t = useTranslations("athletes.groups");
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
		const [isMembersOpen, setIsMembersOpen] = React.useState(false);
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
					toast.success(t("success.created"));
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const updateGroupMutation =
			trpc.organization.athleteGroup.update.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.athleteGroup.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			});

		const setMembersMutation =
			trpc.organization.athleteGroup.setMembers.useMutation({
				onSuccess: () => {
					utils.organization.athleteGroup.list.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.memberUpdateFailed"));
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
					hideDefaultHeader
				>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						{/* Accent stripe */}
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						{/* Header content */}
						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<Users2Icon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{isEditing ? t("modal.editTitle") : t("modal.createTitle")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{isEditing
											? t("modal.editDescription")
											: t("modal.createDescription")}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								disabled={isPending}
								className="flex size-8 items-center justify-center rounded-lg transition-all duration-150 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<XIcon className="size-4" />
								<span className="sr-only">Cerrar</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

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
													<FormLabel>{t("modal.name")}</FormLabel>
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
													<FormLabel>{t("modal.description")}</FormLabel>
													<FormControl>
														<Textarea
															placeholder={t("modal.descriptionPlaceholder")}
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="sport"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("modal.sport")}</FormLabel>
														<FormControl>
															<SportSelect
																value={field.value}
																onValueChange={field.onChange}
															/>
														</FormControl>
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
														<FormLabel>{t("modal.ageCategory")}</FormLabel>
														<Select
															value={field.value ?? ""}
															onValueChange={(value) =>
																field.onChange(value || null)
															}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue
																		placeholder={t("modal.selectCategory")}
																	/>
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
									</div>

									<FormField
										control={form.control}
										name="maxCapacity"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("modal.maxCapacity")}</FormLabel>
													<FormControl>
														<Input
															type="number"
															min={1}
															placeholder={t("modal.unlimited")}
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

									<FormField
										control={form.control}
										name="isActive"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("modal.status")}</FormLabel>
													<Select
														value={field.value ? "active" : "inactive"}
														onValueChange={(value) =>
															field.onChange(value === "active")
														}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue
																	placeholder={t("modal.selectStatus")}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="active">
																{t("status.active")}
															</SelectItem>
															<SelectItem value="inactive">
																{t("status.inactive")}
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{/* Members Section */}
									<Collapsible
										open={isMembersOpen}
										onOpenChange={setIsMembersOpen}
										className="rounded-lg border"
									>
										<CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/50">
											<div className="flex items-center gap-2">
												<UsersIcon className="size-4" />
												<span className="font-medium text-sm">
													{t("modal.members")}
												</span>
												{selectedAthletes.length > 0 && (
													<Badge variant="secondary" className="ml-1">
														{selectedAthletes.length}
													</Badge>
												)}
											</div>
											<span className="text-muted-foreground text-xs">
												{isMembersOpen
													? t("modal.hideMembers")
													: t("modal.showMembers")}
											</span>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<div className="space-y-3 border-t p-3">
												{/* Search Athletes */}
												<Popover
													open={popoverOpen}
													onOpenChange={setPopoverOpen}
												>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="w-full justify-start font-normal"
														>
															<SearchIcon className="mr-2 size-4 text-muted-foreground" />
															{t("modal.searchAthletes")}
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-[300px] p-0"
														align="start"
													>
														<Command shouldFilter={false}>
															<CommandInput
																placeholder={t("modal.searchAthletes")}
																value={searchQuery}
																onValueChange={setSearchQuery}
															/>
															<CommandList>
																{!shouldSearch && (
																	<div className="py-6 text-center text-sm text-muted-foreground">
																		{t("modal.typeToSearch")}
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
																		<CommandEmpty>
																			{t("modal.noAthletesFound")}
																		</CommandEmpty>
																	)}
																{shouldSearch &&
																	!isSearching &&
																	athletes.length > 0 && (
																		<CommandGroup>
																			{athletes.map((athlete) => {
																				const isSelected =
																					selectedAthleteIds.includes(
																						athlete.id,
																					);
																				return (
																					<CommandItem
																						key={athlete.id}
																						value={athlete.id}
																						onSelect={() =>
																							toggleAthlete(athlete)
																						}
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
																									athlete.user?.image ??
																									undefined
																								}
																							/>
																							<span className="truncate">
																								{athlete.user?.name ??
																									"Unknown"}
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

												{/* Selected Athletes List */}
												{selectedAthletes.length > 0 ? (
													<div className="space-y-2">
														{selectedAthletes.map((athlete) => (
															<div
																key={athlete.id}
																className="flex items-center gap-3 rounded-md bg-primary/10 p-2 transition-colors"
															>
																<UserAvatar
																	className="size-6"
																	name={athlete.name}
																	src={athlete.image ?? undefined}
																/>
																<span className="flex-1 text-sm">
																	{athlete.name}
																</span>
																<button
																	type="button"
																	onClick={() => removeAthlete(athlete.id)}
																	className="rounded-full p-1 hover:bg-muted-foreground/20"
																>
																	<XIcon className="size-3" />
																</button>
															</div>
														))}
													</div>
												) : (
													<p className="py-4 text-center text-muted-foreground text-sm">
														{t("modal.noMembersSelected")}
													</p>
												)}
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
									className="min-w-[100px]"
								>
									<XIcon className="size-4" />
									{t("modal.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={isPending}
									loading={isPending}
									className="min-w-[100px]"
								>
									{isEditing ? (
										<CheckIcon className="size-4" />
									) : (
										<PlusIcon className="size-4" />
									)}
									{isEditing ? t("modal.update") : t("modal.create")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
