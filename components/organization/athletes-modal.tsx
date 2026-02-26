"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckIcon,
	ClipboardCopyIcon,
	GlobeIcon,
	MailIcon,
	PlusIcon,
	UserPlusIcon,
	UsersIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ProfileImageUpload } from "@/components/organization/profile-image-upload";
import { InstitutionSelector } from "@/components/shared/institution-selector";
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
import { SportSelect } from "@/components/ui/sport-select";
import { Switch } from "@/components/ui/switch";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	AthleteLevel,
	AthleteLevels,
	type AthleteSex,
	AthleteSexes,
	AthleteSport,
	AthleteStatus,
	AthleteStatuses,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
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
		sex?: string | null;
		phone?: string | null;
		currentClubId?: string | null;
		isPublicProfile?: boolean;
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
			imageKey: string | null;
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
		const t = useTranslations("athletes");
		const isEditing = !!athlete;

		// Translation helpers
		const translateLevel = (level: AthleteLevel) => {
			return t(`levels.${level}` as Parameters<typeof t>[0]);
		};

		const translateStatus = (status: AthleteStatus) => {
			return t(`statuses.${status}` as Parameters<typeof t>[0]);
		};
		const [temporaryPassword, setTemporaryPassword] = React.useState<
			string | null
		>(null);
		const [invitationSent, setInvitationSent] = React.useState(false);
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
					toast.success(t("modal.createdWithPassword"));
				} else if (data.invitationSent) {
					setInvitationSent(true);
					toast.success(t("modal.invitationSent"));
				} else {
					toast.success(t("modal.createdSuccess"));
					utils.organization.athlete.list.invalidate();
					utils.organization.athleteGroup.listActive.invalidate();
					modal.handleClose();
				}
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateAthleteMutation = trpc.organization.athlete.update.useMutation({
			onSuccess: () => {
				toast.success(t("modal.updatedSuccess"));
				utils.organization.athlete.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateAthleteSchema : createAthleteSchema,
			defaultValues: isEditing
				? {
						id: athlete.id,
						name: athlete.user?.name ?? "",
						email: athlete.user?.email ?? "",
						sport: athlete.sport as AthleteSport,
						birthDate: athlete.birthDate ?? undefined,
						level: athlete.level as AthleteLevel,
						status: athlete.status as AthleteStatus,
						sex: (athlete.sex as AthleteSex) ?? undefined,
						phone: athlete.phone ?? "",
						currentClubId: athlete.currentClubId ?? undefined,
						isPublicProfile: athlete.isPublicProfile ?? false,
					}
				: {
						name: prefillUser?.name ?? "",
						email: prefillUser?.email ?? "",
						phone: "",
						sport: AthleteSport.soccer,
						birthDate: undefined,
						level: AthleteLevel.beginner,
						status: AthleteStatus.active,
						sendInvitation: true,
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

		const handleCloseAfterInvitation = () => {
			setInvitationSent(false);
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

		// If invitation was sent, render the success message
		if (invitationSent) {
			return (
				<Sheet
					open={modal.visible}
					onOpenChange={(open) => !open && handleCloseAfterInvitation()}
				>
					<SheetContent
						className="sm:max-w-lg"
						onAnimationEndCapture={modal.handleAnimationEndCapture}
					>
						<SheetHeader>
							<SheetTitle>{t("modal.invitationSentTitle")}</SheetTitle>
							<SheetDescription>
								{t("modal.invitationSentDescription")}
							</SheetDescription>
						</SheetHeader>

						<div className="flex flex-1 flex-col gap-4 px-6 py-4">
							<Alert>
								<MailIcon className="size-4" />
								<AlertTitle>{t("modal.invitationSentAlert")}</AlertTitle>
								<AlertDescription className="mt-2">
									{t("modal.invitationSentNote")}
								</AlertDescription>
							</Alert>
						</div>

						<SheetFooter className="flex-row justify-end gap-2 border-t">
							<Button type="button" onClick={handleCloseAfterInvitation}>
								<CheckIcon className="size-4" />
								{t("modal.done")}
							</Button>
						</SheetFooter>
					</SheetContent>
				</Sheet>
			);
		}

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
								<AlertTitle>{t("modal.temporaryPassword")}</AlertTitle>
								<AlertDescription className="mt-2">
									<code className="rounded bg-muted px-2 py-1 font-mono text-sm">
										{temporaryPassword}
									</code>
								</AlertDescription>
							</Alert>

							<p className="text-muted-foreground text-sm">
								{t("modal.temporaryPasswordNote")}
							</p>
						</div>

						<SheetFooter className="flex-row justify-end gap-2 border-t">
							<Button
								type="button"
								variant="ghost"
								onClick={handleCopyPassword}
							>
								<ClipboardCopyIcon className="size-4" />
								{t("modal.copyPassword")}
							</Button>
							<Button type="button" onClick={handleCloseAfterPassword}>
								<CheckIcon className="size-4" />
								{t("modal.done")}
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
					className="sm:max-w-lg overflow-hidden"
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
									<UserPlusIcon className="size-5" />
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
						<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
							<ScrollArea className="min-h-0 flex-1">
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
																	<FormLabel>{t("form.name")}</FormLabel>
																	<FormControl>
																		<Input
																			placeholder="Juan Pérez"
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
																	<FormLabel>{t("form.email")}</FormLabel>
																	<FormControl>
																		<Input
																			type="email"
																			placeholder="juan@ejemplo.com"
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
														name="phone"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>{t("form.phone")}</FormLabel>
																	<FormControl>
																		<Input
																			type="tel"
																			placeholder="+54 9 11 1234-5678"
																			autoComplete="off"
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
														name="sendInvitation"
														render={({ field }) => (
															<FormItem className="flex items-center justify-between rounded-lg border p-3">
																<div className="space-y-0.5">
																	<FormLabel className="text-sm font-medium">
																		{t("modal.sendInvitation")}
																	</FormLabel>
																	<p className="text-muted-foreground text-xs">
																		{t("modal.sendInvitationDescription")}
																	</p>
																</div>
																<FormControl>
																	<Switch
																		checked={field.value}
																		onCheckedChange={field.onChange}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
												</>
											)}
										</>
									)}

									{isEditing && athlete?.user && (
										<>
											<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
												<ProfileImageUpload
													userId={athlete.user.id}
													userName={athlete.user.name}
													currentImageUrl={
														athlete.user.imageKey
															? undefined
															: athlete.user.image
													}
													hasS3Image={!!athlete.user.imageKey}
													size="sm"
												/>
												<div>
													<p className="font-medium text-sm">
														{athlete.user.name}
													</p>
													<p className="text-muted-foreground text-sm">
														{athlete.user.email}
													</p>
												</div>
											</div>

											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("form.name")}</FormLabel>
															<FormControl>
																<Input
																	placeholder="Juan Pérez"
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
															<FormLabel>{t("form.email")}</FormLabel>
															<FormControl>
																<Input
																	type="email"
																	placeholder="juan@ejemplo.com"
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
												name="phone"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("form.phone")}</FormLabel>
															<FormControl>
																<Input
																	type="tel"
																	placeholder="+54 9 11 1234-5678"
																	autoComplete="off"
																	{...field}
																	value={field.value ?? ""}
																/>
															</FormControl>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</>
									)}

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="sport"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.sport")}</FormLabel>
														<FormControl>
															<SportSelect
																value={field.value}
																onValueChange={(value) =>
																	field.onChange(value ?? AthleteSport.soccer)
																}
																className="w-full"
															/>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="level"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.level")}</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue
																		placeholder={t("modal.selectLevel")}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{AthleteLevels.map((level) => (
																	<SelectItem key={level} value={level}>
																		{translateLevel(level)}
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
										name="birthDate"
										render={({ field }) => {
											const dateValue =
												field.value instanceof Date
													? field.value.toISOString().split("T")[0]
													: "";
											return (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.birthDate")}</FormLabel>
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
										name="sex"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("sex.label")}</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value ?? ""}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue
																	placeholder={t("sex.placeholder")}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{AthleteSexes.map((sex) => (
																<SelectItem key={sex} value={sex}>
																	{t(`sex.${sex}` as Parameters<typeof t>[0])}
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
										name="currentClubId"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.currentClub")}</FormLabel>
													<FormControl>
														<InstitutionSelector
															type="club"
															value={field.value ?? null}
															onChange={(val) => field.onChange(val)}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{isEditing && (
										<FormField
											control={form.control}
											name="status"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.status")}</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue
																		placeholder={t("modal.selectStatus")}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{AthleteStatuses.map((status) => (
																	<SelectItem key={status} value={status}>
																		{translateStatus(status)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormMessage />
													</Field>
												</FormItem>
											)}
										/>
									)}

									{isEditing && (
										<FormField
											control={form.control}
											name="isPublicProfile"
											render={({ field }) => (
												<FormItem className="flex items-center justify-between rounded-lg border p-3">
													<div className="flex items-center gap-2">
														<GlobeIcon className="size-4 text-muted-foreground" />
														<div className="space-y-0.5">
															<FormLabel className="text-sm font-medium">
																{t("modal.publicProfile")}
															</FormLabel>
															<p className="text-muted-foreground text-xs">
																{t("modal.publicProfileDescription")}
															</p>
														</div>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									)}

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
													<span className="font-medium text-sm">
														{t("modal.groups")}
													</span>
													{selectedGroupIds.size > 0 && (
														<Badge variant="secondary" className="ml-1">
															{selectedGroupIds.size}
														</Badge>
													)}
												</div>
												<span className="text-muted-foreground text-xs">
													{isGroupsOpen
														? t("modal.hideGroups")
														: t("modal.showGroups")}
												</span>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<div className="space-y-2 border-t p-3">
													{isLoadingGroups ? (
														<div className="py-4 text-center text-muted-foreground text-sm">
															{t("modal.loadingGroups")}
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

							<SheetFooter className="flex-row justify-end gap-3">
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
