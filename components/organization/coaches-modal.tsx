"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckIcon,
	ClipboardCopyIcon,
	MailIcon,
	PlusIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ProfileImageUpload } from "@/components/organization/profile-image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	AthleteSport,
	CoachStatus,
	CoachStatuses,
} from "@/lib/db/schema/enums";
import {
	createCoachSchema,
	updateCoachSchema,
} from "@/schemas/organization-coach-schemas";
import { trpc } from "@/trpc/client";

export type CoachesModalProps = NiceModalHocProps & {
	coach?: {
		id: string;
		phone?: string | null;
		birthDate?: Date | null;
		sport?: string | null;
		specialty: string;
		bio?: string | null;
		status: string;
		user?: {
			id: string;
			name: string;
			email: string;
			image: string | null;
			imageKey: string | null;
		} | null;
	};
	prefillUser?: {
		id: string;
		name: string;
		email: string;
	};
};

export const CoachesModal = NiceModal.create<CoachesModalProps>(
	({ coach, prefillUser }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("coaches");
		const isEditing = !!coach;
		const [temporaryPassword, setTemporaryPassword] = React.useState<
			string | null
		>(null);
		const [invitationSent, setInvitationSent] = React.useState(false);

		// Tag input state for specialties
		const [specialtyInput, setSpecialtyInput] = React.useState("");

		const translateStatus = (status: string) => {
			return t(`statuses.${status}` as Parameters<typeof t>[0]);
		};

		const createCoachMutation = trpc.organization.coach.create.useMutation({
			onSuccess: (data) => {
				if (data.temporaryPassword) {
					setTemporaryPassword(data.temporaryPassword);
					toast.success(t("modal.createdWithPassword"));
				} else if (data.invitationSent) {
					setInvitationSent(true);
					toast.success(t("modal.invitationSent"));
				} else {
					toast.success(t("modal.createdSuccess"));
					utils.organization.coach.list.invalidate();
					modal.handleClose();
				}
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateCoachMutation = trpc.organization.coach.update.useMutation({
			onSuccess: () => {
				toast.success(t("modal.updatedSuccess"));
				utils.organization.coach.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateCoachSchema : createCoachSchema,
			defaultValues: isEditing
				? {
						id: coach.id,
						phone: coach.phone ?? "",
						birthDate: coach.birthDate ?? undefined,
						sport: (coach.sport as AthleteSport) ?? undefined,
						specialty: coach.specialty,
						bio: coach.bio ?? "",
						status: coach.status as CoachStatus,
					}
				: {
						name: prefillUser?.name ?? "",
						email: prefillUser?.email ?? "",
						phone: "",
						birthDate: undefined,
						sport: AthleteSport.soccer,
						specialty: "",
						bio: "",
						status: CoachStatus.active,
						sendInvitation: true,
					},
		});

		const hasPrefillUser = !!prefillUser;

		// Parse specialty tags from the form value
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
			const current = specialtyTags;
			if (current.some((t) => t.toLowerCase() === trimmed.toLowerCase()))
				return;
			const newValue = [...current, trimmed].join(", ");
			form.setValue("specialty", newValue, { shouldValidate: true });
			setSpecialtyInput("");
		};

		const removeTag = (index: number) => {
			const newTags = specialtyTags.filter((_, i) => i !== index);
			form.setValue("specialty", newTags.join(", "), { shouldValidate: true });
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

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateCoachMutation.mutate(
					data as Parameters<typeof updateCoachMutation.mutate>[0],
				);
			} else {
				createCoachMutation.mutate(
					data as Parameters<typeof createCoachMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createCoachMutation.isPending || updateCoachMutation.isPending;

		const handleCloseAfterPassword = () => {
			setTemporaryPassword(null);
			utils.organization.coach.list.invalidate();
			modal.handleClose();
		};

		const handleCloseAfterInvitation = () => {
			setInvitationSent(false);
			utils.organization.coach.list.invalidate();
			modal.handleClose();
		};

		const handleCopyPassword = async () => {
			if (temporaryPassword) {
				await navigator.clipboard.writeText(temporaryPassword);
				toast.success(t("modal.passwordCopied"));
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
							<SheetTitle>{t("modal.temporaryPasswordTitle")}</SheetTitle>
							<SheetDescription>
								{t("modal.temporaryPasswordDescription")}
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
								<span className="sr-only">Close</span>
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
																			placeholder="Juan P\u00e9rez"
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
												</>
											)}

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

									{isEditing && coach?.user && (
										<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
											<ProfileImageUpload
												userId={coach.user.id}
												userName={coach.user.name}
												currentImageUrl={
													coach.user.imageKey ? undefined : coach.user.image
												}
												hasS3Image={!!coach.user.imageKey}
												size="sm"
											/>
											<div>
												<p className="font-medium text-sm">{coach.user.name}</p>
												<p className="text-muted-foreground text-sm">
													{coach.user.email}
												</p>
											</div>
										</div>
									)}

									{isEditing && (
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
									)}

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

									{/* Specialty Tags Input */}
									<FormField
										control={form.control}
										name="specialty"
										render={() => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.specialty")}</FormLabel>
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
															onChange={(e) =>
																setSpecialtyInput(e.target.value)
															}
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
										name="bio"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.bio")}</FormLabel>
													<FormControl>
														<Textarea
															placeholder="..."
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
															{CoachStatuses.map((status) => (
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
