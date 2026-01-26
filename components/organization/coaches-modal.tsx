"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import * as React from "react";
import { toast } from "sonner";
import { ProfileImageUpload } from "@/components/organization/profile-image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { CoachStatus, CoachStatuses } from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import {
	createCoachSchema,
	updateCoachSchema,
} from "@/schemas/organization-coach-schemas";
import { trpc } from "@/trpc/client";

export type CoachesModalProps = NiceModalHocProps & {
	coach?: {
		id: string;
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
		const isEditing = !!coach;
		const [temporaryPassword, setTemporaryPassword] = React.useState<
			string | null
		>(null);

		const createCoachMutation = trpc.organization.coach.create.useMutation({
			onSuccess: (data) => {
				if (data.temporaryPassword) {
					setTemporaryPassword(data.temporaryPassword);
					toast.success(
						"Coach created successfully. Please save the temporary password.",
					);
				} else {
					toast.success("Coach created successfully");
					utils.organization.coach.list.invalidate();
					modal.handleClose();
				}
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create coach");
			},
		});

		const updateCoachMutation = trpc.organization.coach.update.useMutation({
			onSuccess: () => {
				toast.success("Coach updated successfully");
				utils.organization.coach.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update coach");
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateCoachSchema : createCoachSchema,
			defaultValues: isEditing
				? {
						id: coach.id,
						specialty: coach.specialty,
						bio: coach.bio ?? "",
						status: coach.status as CoachStatus,
					}
				: {
						name: prefillUser?.name ?? "",
						email: prefillUser?.email ?? "",
						specialty: "",
						bio: "",
						status: CoachStatus.active,
					},
		});

		const hasPrefillUser = !!prefillUser;

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
							<SheetTitle>Coach Created Successfully</SheetTitle>
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
								Share this password with the coach. They will need to change it
								after their first login.
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
						<SheetTitle>{isEditing ? "Edit Coach" : "Create Coach"}</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the coach information below."
								: "Fill in the details to create a new coach."}
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

									{isEditing && coach?.user && (
										<div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/50 p-4">
											<ProfileImageUpload
												userId={coach.user.id}
												userName={coach.user.name}
												currentImageUrl={
													coach.user.imageKey ? undefined : coach.user.image
												}
												hasS3Image={!!coach.user.imageKey}
												size="lg"
											/>
											<div className="text-center">
												<p className="font-medium text-sm">{coach.user.name}</p>
												<p className="text-muted-foreground text-sm">
													{coach.user.email}
												</p>
											</div>
										</div>
									)}

									<FormField
										control={form.control}
										name="specialty"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Specialty</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g., Leadership Coaching"
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
										name="bio"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Bio</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Brief description about the coach..."
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
															{CoachStatuses.map((status) => (
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
									{isEditing ? "Update Coach" : "Create Coach"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
