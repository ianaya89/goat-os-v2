"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { CheckIcon, PlusIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
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
	SheetFooter,
	SheetTitle,
} from "@/components/ui/sheet";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { type MemberRole, MemberRoles } from "@/lib/db/schema/enums";
import {
	createOrganizationUserSchema,
	updateOrganizationUserSchema,
} from "@/schemas/organization-user-schemas";
import { trpc } from "@/trpc/client";

export type OrganizationUserFormModalProps = NiceModalHocProps & {
	user?: {
		id: string;
		name: string;
		email: string;
		role: string;
		hasProfiles: boolean;
	};
};

export const OrganizationUserFormModal =
	NiceModal.create<OrganizationUserFormModalProps>(({ user }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("users");
		const isEditing = !!user;

		const createMutation = trpc.organization.user.create.useMutation({
			onSuccess: () => {
				toast.success(t("success.created"));
				utils.organization.user.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.createFailed"));
			},
		});

		const updateMutation = trpc.organization.user.update.useMutation({
			onSuccess: () => {
				toast.success(t("success.updated"));
				utils.organization.user.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.updateFailed"));
			},
		});

		const form = useZodForm({
			schema: isEditing
				? updateOrganizationUserSchema
				: createOrganizationUserSchema,
			defaultValues: isEditing
				? {
						userId: user.id,
						name: user.name,
						email: user.email,
						role: user.role as MemberRole,
					}
				: {
						name: "",
						email: "",
						role: "member" as MemberRole,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateMutation.mutate(
					data as Parameters<typeof updateMutation.mutate>[0],
				);
			} else {
				createMutation.mutate(
					data as Parameters<typeof createMutation.mutate>[0],
				);
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;
		const hasProfiles = isEditing && !!user?.hasProfiles;

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
					<SheetTitle className="sr-only">
						{isEditing ? t("formModal.editTitle") : t("formModal.createTitle")}
					</SheetTitle>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<UserPlusIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{isEditing
											? t("formModal.editTitle")
											: t("formModal.createTitle")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{isEditing
											? t("formModal.editSubtitle")
											: t("formModal.createSubtitle")}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								disabled={isPending}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<XIcon className="size-4" />
								<span className="sr-only">Close</span>
							</button>
						</div>

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
													<FormLabel>{t("formModal.name")}</FormLabel>
													<FormControl>
														<Input
															placeholder={t("formModal.namePlaceholder")}
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
													<FormLabel>{t("formModal.email")}</FormLabel>
													<FormControl>
														<Input
															type="email"
															placeholder={t("formModal.emailPlaceholder")}
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
										name="role"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("formModal.role")}</FormLabel>
													{hasProfiles ? (
														<>
															<Select value={field.value} disabled>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue
																			placeholder={t("formModal.selectRole")}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{MemberRoles.map((role) => (
																		<SelectItem key={role} value={role}>
																			{t(
																				`roles.${role}` as Parameters<
																					typeof t
																				>[0],
																			)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<p className="text-muted-foreground text-xs">
																{t("modal.roleAutoAssigned")}
															</p>
														</>
													) : (
														<Select
															value={field.value}
															onValueChange={field.onChange}
														>
															<FormControl>
																<SelectTrigger className="w-full">
																	<SelectValue
																		placeholder={t("formModal.selectRole")}
																	/>
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{MemberRoles.map((role) => (
																	<SelectItem key={role} value={role}>
																		{t(
																			`roles.${role}` as Parameters<
																				typeof t
																			>[0],
																		)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
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
									{t("formModal.cancel")}
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
									{isEditing ? t("formModal.update") : t("formModal.create")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
