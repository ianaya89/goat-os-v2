"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { UsersIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	AthleteLevel,
	AthleteLevels,
	AthleteSport,
	AthleteSports,
	AthleteStatus,
	AthleteStatuses,
} from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
import {
	createAthleteSchema,
	updateAthleteSchema,
} from "@/schemas/organization-athlete-schemas";
import { trpc } from "@/trpc/client";

export type AthletesModalProps = NiceModalHocProps & {
	athlete?: {
		id: string;
		sport: string;
		birthDate?: Date | null;
		level: string;
		status: string;
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
		groups?: Array<{
			id: string;
			name: string;
		}>;
	};
	prefillUser?: {
		id: string;
		name: string;
		email: string;
	};
};

export const AthletesModal = NiceModal.create<AthletesModalProps>(
	({ athlete, prefillUser }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!athlete;
		const [temporaryPassword, setTemporaryPassword] = React.useState<
			string | null
		>(null);
		const [isGroupsOpen, setIsGroupsOpen] = React.useState(false);

		// Groups management
		const initialGroupIds = React.useMemo(
			() => new Set(athlete?.groups?.map((g) => g.id) ?? []),
			[athlete?.groups],
		);
		const [selectedGroupIds, setSelectedGroupIds] = React.useState<Set<string>>(
			() => new Set(initialGroupIds),
		);
		const [, setNewAthleteId] = React.useState<string | null>(null);

		// Query for available groups
		const { data: availableGroups, isLoading: isLoadingGroups } =
			trpc.organization.athleteGroup.listActive.useQuery();

		// Mutations for group management
		const addToGroupMutation =
			trpc.organization.athleteGroup.addMembers.useMutation();
		const removeFromGroupMutation =
			trpc.organization.athleteGroup.removeMembers.useMutation();

		const toggleGroup = (groupId: string) => {
			setSelectedGroupIds((prev) => {
				const next = new Set(prev);
				if (next.has(groupId)) {
					next.delete(groupId);
				} else {
					next.add(groupId);
				}
				return next;
			});
		};

		const createAthleteMutation = trpc.organization.athlete.create.useMutation({
			onSuccess: async (data) => {
				// Store the new athlete ID for adding to groups
				if (data.athlete?.id) {
					setNewAthleteId(data.athlete.id);

					// Add to selected groups
					if (selectedGroupIds.size > 0) {
						const groupPromises = [...selectedGroupIds].map((groupId) =>
							addToGroupMutation.mutateAsync({
								groupId,
								athleteIds: [data.athlete!.id],
							}),
						);
						await Promise.all(groupPromises).catch(() => {
							toast.error("Error al agregar a algunos grupos");
						});
					}
				}

				if (data.temporaryPassword) {
					setTemporaryPassword(data.temporaryPassword);
					toast.success(
						"Athlete created successfully. Please save the temporary password.",
					);
				} else {
					toast.success("Athlete created successfully");
					utils.organization.athlete.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
					modal.handleClose();
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create athlete");
			},
		});

		const updateAthleteMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success("Athlete updated successfully");
				utils.organization.athlete.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update athlete");
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateAthleteSchema : createAthleteSchema,
			defaultValues: isEditing
				? {
						id: athlete.id,
						sport: athlete.sport as AthleteSport,
						birthDate: athlete.birthDate ?? undefined,
						level: athlete.level as AthleteLevel,
						status: athlete.status as AthleteStatus,
					}
				: {
						name: prefillUser?.name ?? "",
						email: prefillUser?.email ?? "",
						sport: AthleteSport.soccer,
						birthDate: undefined,
						level: AthleteLevel.beginner,
						status: AthleteStatus.active,
					},
		});

		const hasPrefillUser = !!prefillUser;

		const onSubmit = form.handleSubmit(async (data) => {
			if (isEditing && athlete) {
				// Calculate group changes
				const groupsToAdd = [...selectedGroupIds].filter(
					(id) => !initialGroupIds.has(id),
				);
				const groupsToRemove = [...initialGroupIds].filter(
					(id) => !selectedGroupIds.has(id),
				);

				// Update group memberships
				const groupPromises: Promise<unknown>[] = [];

				for (const groupId of groupsToAdd) {
					groupPromises.push(
						addToGroupMutation.mutateAsync({
							groupId,
							athleteIds: [athlete.id],
						}),
					);
				}

				for (const groupId of groupsToRemove) {
					groupPromises.push(
						removeFromGroupMutation.mutateAsync({
							groupId,
							athleteIds: [athlete.id],
						}),
					);
				}

				// Wait for all group updates
				if (groupPromises.length > 0) {
					await Promise.all(groupPromises);
					utils.organization.athleteGroup.listActive.invalidate();
				}

				updateAthleteMutation.mutate(
					data as Parameters<typeof updateAthleteMutation.mutate>[0],
				);
			} else {
				createAthleteMutation.mutate(
					data as Parameters<typeof createAthleteMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createAthleteMutation.isPending ||
			updateAthleteMutation.isPending ||
			addToGroupMutation.isPending ||
			removeFromGroupMutation.isPending;

		const handleCloseAfterPassword = () => {
			setTemporaryPassword(null);
			utils.organization.athlete.list.invalidate();
			utils.organization.athleteGroup.listActive.invalidate();
			modal.handleClose();
		};

		const handleCopyPassword = async () => {
			if (temporaryPassword) {
				await navigator.clipboard.writeText(temporaryPassword);
				toast.success("Password copied to clipboard");
			}
		};

		// If we have a temporary password to show, render the password display
		if (temporaryPassword) {
			return (
				<Sheet
					open={modal.visible}
					onOpenChange={(open) => !open && handleCloseAfterPassword()}
				>
					<SheetContent
						className="sm:max-w-lg"
						onAnimationEndCapture={modal.handleAnimationEndCapture}
					>
						<SheetHeader>
							<SheetTitle>Athlete Created Successfully</SheetTitle>
							<SheetDescription>
								Please save the temporary password below. It will only be shown
								once.
							</SheetDescription>
						</SheetHeader>

						<div className="flex flex-1 flex-col gap-4 px-6 py-4">
							<Alert>
								<AlertTitle>Temporary Password</AlertTitle>
								<AlertDescription className="mt-2">
									<code className="rounded bg-muted px-2 py-1 font-mono text-sm">
										{temporaryPassword}
									</code>
								</AlertDescription>
							</Alert>

							<p className="text-muted-foreground text-sm">
								Share this password with the athlete. They will need to change
								it after their first login.
							</p>
						</div>

						<SheetFooter className="flex-row justify-end gap-2 border-t">
							<Button
								type="button"
								variant="outline"
								onClick={handleCopyPassword}
							>
								Copy Password
							</Button>
							<Button type="button" onClick={handleCloseAfterPassword}>
								Done
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			);
		}

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
							{isEditing ? "Edit Athlete" : "Create Athlete"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the athlete information below."
								: "Fill in the details to create a new athlete."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									{!isEditing && (
										<>
											{hasPrefillUser && (
												<div className="rounded-lg border bg-muted/50 p-4">
													<p className="font-medium text-sm">
														{prefillUser.name}
													</p>
													<p className="text-muted-foreground text-sm">
														{prefillUser.email}
													</p>
												</div>
											)}
											{!hasPrefillUser && (
												<>
													<FormField
														control={form.control}
														name="name"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Name</FormLabel>
																	<FormControl>
																		<Input
																			placeholder="John Doe"
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
														name="email"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Email</FormLabel>
																	<FormControl>
																		<Input
																			type="email"
																			placeholder="john.doe@example.com"
																			autoComplete="off"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>
												</>
											)}
										</>
									)}

									{isEditing && athlete?.user && (
										<div className="rounded-lg border bg-muted/50 p-4">
											<p className="font-medium text-sm">{athlete.user.name}</p>
											<p className="text-muted-foreground text-sm">
												{athlete.user.email}
											</p>
										</div>
									)}

									<FormField
										control={form.control}
										name="sport"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Sport</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select sport" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{AthleteSports.map((sport) => (
																<SelectItem key={sport} value={sport}>
																	{capitalize(sport.replace("_", " "))}
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
										name="birthDate"
										render={({ field }) => {
											const dateValue =
												field.value instanceof Date
													? field.value.toISOString().split("T")[0]
													: "";
											return (
												<FormItem asChild>
													<Field>
														<FormLabel>Birth Date</FormLabel>
														<FormControl>
															<Input
																type="date"
																{...field}
																value={dateValue}
																onChange={(e) => {
																	const value = e.target.value;
																	field.onChange(
																		value ? new Date(value) : undefined,
																	);
																}}
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											);
										}}
									/>

									<FormField
										control={form.control}
										name="level"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Level</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select level" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{AthleteLevels.map((level) => (
																<SelectItem key={level} value={level}>
																	{capitalize(level)}
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
													<FormLabel>Status</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Select status" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{AthleteStatuses.map((status) => (
																<SelectItem key={status} value={status}>
																	{capitalize(status)}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{/* Groups Section */}
									{availableGroups && availableGroups.length > 0 && (
										<Collapsible
											open={isGroupsOpen}
											onOpenChange={setIsGroupsOpen}
											className="rounded-lg border"
										>
											<CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-muted/50">
												<div className="flex items-center gap-2">
													<UsersIcon className="size-4" />
													<span className="font-medium text-sm">Grupos</span>
													{selectedGroupIds.size > 0 && (
														<Badge variant="secondary" className="ml-1">
															{selectedGroupIds.size}
														</Badge>
													)}
												</div>
												<span className="text-muted-foreground text-xs">
													{isGroupsOpen ? "Ocultar" : "Mostrar"}
												</span>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<div className="space-y-2 border-t p-3">
													{isLoadingGroups ? (
														<div className="py-4 text-center text-muted-foreground text-sm">
															Cargando grupos...
														</div>
													) : (
														availableGroups.map((group) => {
															const isSelected = selectedGroupIds.has(group.id);
															const memberCount = group.members?.length ?? 0;

															return (
																<div
																	key={group.id}
																	className={cn(
																		"flex items-center gap-3 rounded-md p-2 transition-colors",
																		isSelected
																			? "bg-primary/10"
																			: "hover:bg-muted/50",
																	)}
																>
																	<Checkbox
																		id={`modal-group-${group.id}`}
																		checked={isSelected}
																		onCheckedChange={() =>
																			toggleGroup(group.id)
																		}
																	/>
																	<label
																		htmlFor={`modal-group-${group.id}`}
																		className="flex flex-1 cursor-pointer items-center justify-between"
																	>
																		<span className="text-sm">
																			{group.name}
																		</span>
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			{memberCount}
																		</Badge>
																	</label>
																</div>
															);
														})
													)}
												</div>
											</CollapsibleContent>
										</Collapsible>
									)}
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
									{isEditing ? "Update Athlete" : "Create Athlete"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
