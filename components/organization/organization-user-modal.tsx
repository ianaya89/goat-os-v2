"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CalendarIcon,
	CheckCircleIcon,
	CheckIcon,
	ExternalLinkIcon,
	KeyRoundIcon,
	MailIcon,
	MedalIcon,
	ShieldBanIcon,
	ShieldCheckIcon,
	SmartphoneIcon,
	UserCheckIcon,
	UserIcon,
	XCircleIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { AthletesModal } from "@/components/organization/athletes-modal";
import { CoachesModal } from "@/components/organization/coaches-modal";
import { OrganizationBanUserModal } from "@/components/organization/organization-ban-user-modal";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import type { MemberRole } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { updateOrganizationUserRoleSchema } from "@/schemas/organization-user-schemas";
import { trpc } from "@/trpc/client";

export type OrganizationUserModalProps = NiceModalHocProps & {
	user: {
		id: string;
		memberId: string;
		name: string;
		email: string;
		image: string | null;
		emailVerified: boolean;
		role: string;
		joinedAt: Date;
		userCreatedAt: Date;
		banned: boolean;
		banReason: string | null;
		banExpires: Date | null;
		twoFactorEnabled: boolean;
		coachProfile: {
			id: string;
			specialty: string;
			status: string;
		} | null;
		athleteProfile: {
			id: string;
			sport: string;
			level: string;
			status: string;
		} | null;
	};
};

const roleColors: Record<string, string> = {
	owner:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
	admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	staff:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
	member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusColors: Record<string, string> = {
	active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
	inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const assignableRoles = ["owner", "admin", "staff", "member"] as const;

export const OrganizationUserModal =
	NiceModal.create<OrganizationUserModalProps>(({ user }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("users");

		const updateRoleMutation = trpc.organization.user.updateRole.useMutation({
			onSuccess: () => {
				toast.success(t("success.roleUpdated"));
				utils.organization.user.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.roleUpdateFailed"));
			},
		});

		const sendPasswordResetMutation =
			trpc.organization.user.sendPasswordReset.useMutation({
				onSuccess: () => {
					toast.success(t("success.passwordResetSent"));
				},
				onError: (error) => {
					toast.error(error.message || t("error.passwordResetFailed"));
				},
			});

		const resendVerificationMutation =
			trpc.organization.user.resendVerificationEmail.useMutation({
				onSuccess: () => {
					toast.success(t("success.verificationSent"));
				},
				onError: (error) => {
					toast.error(error.message || t("error.verificationFailed"));
				},
			});

		const unbanUserMutation = trpc.organization.user.unban.useMutation({
			onSuccess: () => {
				toast.success(t("success.unbanned"));
				utils.organization.user.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.unbanFailed"));
			},
		});

		const resetMfaMutation = trpc.organization.user.resetMfa.useMutation({
			onSuccess: () => {
				toast.success(t("success.mfaReset"));
				utils.organization.user.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || t("error.mfaResetFailed"));
			},
		});

		const form = useZodForm({
			schema: updateOrganizationUserRoleSchema,
			defaultValues: {
				userId: user.id,
				role: user.role as MemberRole,
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			updateRoleMutation.mutate(data);
		});

		const handleResendVerification = () => {
			NiceModal.show(ConfirmationModal, {
				title: t("resendVerificationConfirm.title"),
				message: t("resendVerificationConfirm.message", {
					email: user.email,
				}),
				confirmLabel: t("resendVerificationConfirm.confirm"),
				onConfirm: () => resendVerificationMutation.mutate({ userId: user.id }),
			});
		};

		const handleCreateCoachProfile = () => {
			NiceModal.show(CoachesModal, {
				coach: undefined,
				prefillUser: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			});
		};

		const handleCreateAthleteProfile = () => {
			NiceModal.show(AthletesModal, {
				athlete: undefined,
				prefillUser: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			});
		};

		const handlePasswordReset = () => {
			NiceModal.show(ConfirmationModal, {
				title: t("resetPasswordConfirm.title"),
				message: t("resetPasswordConfirm.message", {
					email: user.email,
				}),
				confirmLabel: t("resetPasswordConfirm.confirm"),
				onConfirm: () => sendPasswordResetMutation.mutate({ userId: user.id }),
			});
		};

		const handleBanUser = () => {
			NiceModal.show(OrganizationBanUserModal, {
				userId: user.id,
				userName: user.name,
			});
		};

		const handleUnbanUser = () => {
			NiceModal.show(ConfirmationModal, {
				title: t("unban.title"),
				message: t("unban.message", { name: user.name }),
				confirmLabel: t("unban.confirm"),
				onConfirm: () => unbanUserMutation.mutate({ userId: user.id }),
			});
		};

		const handleResetMfa = () => {
			NiceModal.show(ConfirmationModal, {
				title: t("resetMfaConfirm.title"),
				message: t("resetMfaConfirm.message", { name: user.name }),
				confirmLabel: t("resetMfaConfirm.confirm"),
				onConfirm: () => resetMfaMutation.mutate({ userId: user.id }),
			});
		};

		const hasProfiles = !!user.coachProfile || !!user.athleteProfile;
		const isPending = updateRoleMutation.isPending;

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
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-500" />

						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-sm">
									<UserIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{t("modal.title")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{t("modal.description")}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={modal.handleClose}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<XIcon className="size-4" />
								<span className="sr-only">Close</span>
							</button>
						</div>

						<div className="h-px bg-border" />
					</div>

					<ScrollArea className="flex-1">
						<div className="space-y-4 px-6 py-4">
							{/* User Info */}
							<div className="flex items-center gap-4">
								<UserAvatar
									className="size-14 shrink-0"
									name={user.name}
									src={user.image ?? undefined}
								/>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h3 className="truncate font-semibold text-lg">
											{user.name}
										</h3>
										<Badge
											className={cn(
												"shrink-0 border-none text-xs shadow-none",
												roleColors[user.role] || "bg-gray-100 dark:bg-gray-800",
											)}
											variant="outline"
										>
											{t(`roles.${user.role}` as Parameters<typeof t>[0])}
										</Badge>
									</div>
									<div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-sm">
										<span className="truncate">{user.email}</span>
										{user.emailVerified ? (
											<CheckCircleIcon className="size-3.5 shrink-0 text-green-500" />
										) : (
											<XCircleIcon className="size-3.5 shrink-0 text-muted-foreground" />
										)}
									</div>
									<div className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
										<CalendarIcon className="size-3" />
										<span>
											{t("modal.joined")}:{" "}
											{format(user.joinedAt, "MMM d, yyyy")}
										</span>
									</div>
								</div>
							</div>

							{/* Unverified Email Banner */}
							{!user.emailVerified && (
								<div className="flex items-center justify-between rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
									<div className="flex items-center gap-2">
										<MailIcon className="size-4 text-amber-600 dark:text-amber-400" />
										<span className="font-medium text-amber-800 text-sm dark:text-amber-200">
											{t("emailStatus.pending")}
										</span>
									</div>
									<Button
										variant="outline"
										size="sm"
										className="h-7 text-xs"
										onClick={handleResendVerification}
										disabled={resendVerificationMutation.isPending}
									>
										{resendVerificationMutation.isPending
											? t("modal.sending")
											: t("modal.resendVerification")}
									</Button>
								</div>
							)}

							{/* Ban Status Banner */}
							{user.banned && (
								<div className="space-y-2 rounded-lg border border-red-200/50 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<ShieldBanIcon className="size-4 text-red-600 dark:text-red-400" />
											<span className="font-medium text-red-800 text-sm dark:text-red-200">
												{t("banStatus.banned")}
											</span>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs"
											onClick={handleUnbanUser}
											disabled={unbanUserMutation.isPending}
										>
											<ShieldCheckIcon className="size-3" />
											{t("banStatus.unbanUser")}
										</Button>
									</div>
									{user.banReason && (
										<p className="text-red-700 text-xs dark:text-red-300">
											<span className="font-medium">
												{t("banStatus.reason")}:
											</span>{" "}
											{user.banReason}
										</p>
									)}
									<p className="text-red-700 text-xs dark:text-red-300">
										<span className="font-medium">
											{t("banStatus.expires")}:
										</span>{" "}
										{user.banExpires
											? format(user.banExpires, "MMM d, yyyy")
											: t("banStatus.permanent")}
									</p>
								</div>
							)}

							<Separator />

							{/* Profiles */}
							<div className="space-y-2">
								<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									{t("modal.profilesTitle")}
								</h4>

								<div className="space-y-3">
									{user.coachProfile && (
										<div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
											<div className="flex items-center justify-between">
												<Badge
													className="border-none bg-amber-100 font-medium text-amber-800 text-xs shadow-none dark:bg-amber-900 dark:text-amber-200"
													variant="outline"
												>
													{t("profiles.coach")}
												</Badge>
												<div className="flex items-center gap-2">
													<Badge
														className={cn(
															"border-none text-xs shadow-none",
															statusColors[user.coachProfile.status] ||
																"bg-gray-100 dark:bg-gray-800",
														)}
														variant="outline"
													>
														{t(
															`statuses.${user.coachProfile.status}` as Parameters<
																typeof t
															>[0],
														)}
													</Badge>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														asChild
													>
														<Link
															href={`/dashboard/organization/coaches/${user.coachProfile.id}`}
														>
															<ExternalLinkIcon className="size-4" />
														</Link>
													</Button>
												</div>
											</div>
											<p className="mt-2 text-muted-foreground text-sm">
												{t("modal.specialty")}:{" "}
												{user.coachProfile.specialty || "—"}
											</p>
										</div>
									)}

									{user.athleteProfile && (
										<div className="rounded-lg border border-teal-200/50 bg-teal-50/50 p-3 dark:border-teal-900/30 dark:bg-teal-950/20">
											<div className="flex items-center justify-between">
												<Badge
													className="border-none bg-teal-100 font-medium text-teal-800 text-xs shadow-none dark:bg-teal-900 dark:text-teal-200"
													variant="outline"
												>
													{t("profiles.athlete")}
												</Badge>
												<div className="flex items-center gap-2">
													<Badge
														className={cn(
															"border-none text-xs shadow-none",
															statusColors[user.athleteProfile.status] ||
																"bg-gray-100 dark:bg-gray-800",
														)}
														variant="outline"
													>
														{t(
															`statuses.${user.athleteProfile.status}` as Parameters<
																typeof t
															>[0],
														)}
													</Badge>
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														asChild
													>
														<Link
															href={`/dashboard/organization/athletes/${user.athleteProfile.id}`}
														>
															<ExternalLinkIcon className="size-4" />
														</Link>
													</Button>
												</div>
											</div>
											<p className="mt-2 text-muted-foreground text-sm">
												{t("modal.sport")}: {user.athleteProfile.sport || "—"} |{" "}
												{t("modal.level")}: {user.athleteProfile.level || "—"}
											</p>
										</div>
									)}

									{!hasProfiles && (
										<p className="text-muted-foreground text-sm">
											{t("modal.noProfiles")}
										</p>
									)}

									{(!user.coachProfile || !user.athleteProfile) && (
										<div className="flex flex-wrap gap-2">
											{!user.coachProfile && (
												<Button
													variant="ghost"
													size="sm"
													onClick={handleCreateCoachProfile}
												>
													<UserCheckIcon className="size-4" />
													{t("modal.createCoachProfile")}
												</Button>
											)}
											{!user.athleteProfile && (
												<Button
													variant="ghost"
													size="sm"
													onClick={handleCreateAthleteProfile}
												>
													<MedalIcon className="size-4" />
													{t("modal.createAthleteProfile")}
												</Button>
											)}
										</div>
									)}
								</div>
							</div>

							<Separator />

							{/* Change Role */}
							<div className="space-y-2">
								<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									{t("modal.changeRole")}
								</h4>
								{hasProfiles ? (
									<p className="text-muted-foreground text-sm">
										{t("modal.roleAutoAssigned")}
									</p>
								) : (
									<Form {...form}>
										<form onSubmit={onSubmit} className="space-y-4">
											<FormField
												control={form.control}
												name="role"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>{t("modal.newRole")}</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue
																			placeholder={t("modal.selectRole")}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{assignableRoles.map((role) => (
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
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>
										</form>
									</Form>
								)}
							</div>

							<Separator />

							{/* Actions */}
							<div className="space-y-2">
								<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
									{t("modal.actions")}
								</h4>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={handlePasswordReset}
										disabled={sendPasswordResetMutation.isPending}
									>
										<KeyRoundIcon className="size-4" />
										{t("modal.resetPassword")}
									</Button>
									{user.twoFactorEnabled && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleResetMfa}
											disabled={resetMfaMutation.isPending}
										>
											<SmartphoneIcon className="size-4" />
											{t("table.resetMfa")}
										</Button>
									)}
									{user.banned ? (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleUnbanUser}
											disabled={unbanUserMutation.isPending}
										>
											<ShieldCheckIcon className="size-4" />
											{t("table.unbanUser")}
										</Button>
									) : (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleBanUser}
											className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
										>
											<ShieldBanIcon className="size-4" />
											{t("table.banUser")}
										</Button>
									)}
								</div>
							</div>
						</div>
					</ScrollArea>

					<SheetFooter className="flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
						<Button
							type="button"
							variant="ghost"
							onClick={modal.handleClose}
							className="min-w-[100px]"
						>
							<XIcon className="size-4" />
							{hasProfiles ? t("modal.close") : t("modal.cancel")}
						</Button>
						{!hasProfiles && (
							<Button
								type="button"
								onClick={onSubmit}
								disabled={isPending || form.watch("role") === user.role}
								loading={isPending}
								className="min-w-[100px]"
							>
								<CheckIcon className="size-4" />
								{t("modal.updateRole")}
							</Button>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>
		);
	});
