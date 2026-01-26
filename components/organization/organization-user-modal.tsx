"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	CheckCircleIcon,
	ExternalLinkIcon,
	KeyRoundIcon,
	MailIcon,
	MedalIcon,
	UserCheckIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { AthletesModal } from "@/components/organization/athletes-modal";
import { CoachesModal } from "@/components/organization/coaches-modal";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import type { MemberRole } from "@/lib/db/schema/enums";
import { capitalize, cn } from "@/lib/utils";
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
	owner: "bg-purple-100 dark:bg-purple-900",
	admin: "bg-blue-100 dark:bg-blue-900",
	member: "bg-gray-100 dark:bg-gray-800",
	coach: "bg-amber-100 dark:bg-amber-900",
	athlete: "bg-teal-100 dark:bg-teal-900",
};

// Roles that can be manually assigned (excludes coach and athlete)
const assignableRoles = ["owner", "admin", "member"] as const;

export const OrganizationUserModal =
	NiceModal.create<OrganizationUserModalProps>(({ user }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();

		const updateRoleMutation = trpc.organization.user.updateRole.useMutation({
			onSuccess: () => {
				toast.success("User role updated successfully");
				utils.organization.user.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update user role");
			},
		});

		const sendPasswordResetMutation =
			trpc.organization.user.sendPasswordReset.useMutation({
				onSuccess: () => {
					toast.success("Password reset email sent successfully");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to send password reset email");
				},
			});

		const resendVerificationMutation =
			trpc.organization.user.resendVerificationEmail.useMutation({
				onSuccess: () => {
					toast.success("Verification email sent successfully");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to send verification email");
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

		const handleSendPasswordReset = () => {
			sendPasswordResetMutation.mutate({ userId: user.id });
		};

		const handleResendVerification = () => {
			resendVerificationMutation.mutate({ userId: user.id });
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

		const isPending =
			updateRoleMutation.isPending ||
			sendPasswordResetMutation.isPending ||
			resendVerificationMutation.isPending;

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
						<SheetTitle>User Details</SheetTitle>
						<SheetDescription className="sr-only">
							View and manage user details
						</SheetDescription>
					</SheetHeader>

					<ScrollArea className="flex-1">
						<div className="space-y-6 px-6 py-4">
							{/* User Info */}
							<div className="flex items-center gap-4">
								<UserAvatar
									className="size-16"
									name={user.name}
									src={user.image ?? undefined}
								/>
								<div className="flex-1">
									<h3 className="font-semibold text-lg">{user.name}</h3>
									<div className="flex items-center gap-2 text-muted-foreground text-sm">
										<span>{user.email}</span>
										{user.emailVerified ? (
											<CheckCircleIcon className="size-4 text-green-500" />
										) : (
											<XCircleIcon className="size-4 text-muted-foreground" />
										)}
									</div>
								</div>
							</div>

							<Separator />

							{/* Quick Actions */}
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Quick Actions</h4>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={handleSendPasswordReset}
										disabled={sendPasswordResetMutation.isPending}
									>
										<KeyRoundIcon className="mr-2 size-4" />
										{sendPasswordResetMutation.isPending
											? "Sending..."
											: "Reset Password"}
									</Button>
									{!user.emailVerified && (
										<Button
											variant="outline"
											size="sm"
											onClick={handleResendVerification}
											disabled={resendVerificationMutation.isPending}
										>
											<MailIcon className="mr-2 size-4" />
											{resendVerificationMutation.isPending
												? "Sending..."
												: "Resend Verification"}
										</Button>
									)}
								</div>
							</div>

							<Separator />

							{/* Membership Info */}
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Membership</h4>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">Current Role</span>
										<div className="mt-1">
											<Badge
												className={cn(
													"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
													roleColors[user.role] ||
														"bg-gray-100 dark:bg-gray-800",
												)}
												variant="outline"
											>
												{capitalize(user.role)}
											</Badge>
										</div>
									</div>
									<div>
										<span className="text-muted-foreground">Joined</span>
										<p className="mt-1">
											{format(user.joinedAt, "MMM d, yyyy")}
										</p>
									</div>
								</div>
							</div>

							<Separator />

							{/* Profiles */}
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Profiles</h4>

								{user.coachProfile && (
									<div className="rounded-lg border bg-muted/50 p-3">
										<div className="flex items-center justify-between">
											<Badge
												className="border-none bg-amber-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-amber-900"
												variant="outline"
											>
												Coach
											</Badge>
											<div className="flex items-center gap-2">
												<Badge
													className={cn(
														"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
														user.coachProfile.status === "active"
															? "bg-green-100 dark:bg-green-900"
															: "bg-gray-100 dark:bg-gray-800",
													)}
													variant="outline"
												>
													{capitalize(user.coachProfile.status)}
												</Badge>
												<Link
													href={`/dashboard/organization/coaches?search=${encodeURIComponent(user.email)}`}
													className="text-muted-foreground hover:text-foreground"
												>
													<ExternalLinkIcon className="size-4" />
												</Link>
											</div>
										</div>
										<p className="mt-2 text-muted-foreground text-sm">
											Specialty: {user.coachProfile.specialty}
										</p>
									</div>
								)}

								{user.athleteProfile && (
									<div className="rounded-lg border bg-muted/50 p-3">
										<div className="flex items-center justify-between">
											<Badge
												className="border-none bg-teal-100 px-2 py-0.5 font-medium text-foreground text-xs shadow-none dark:bg-teal-900"
												variant="outline"
											>
												Athlete
											</Badge>
											<div className="flex items-center gap-2">
												<Badge
													className={cn(
														"border-none px-2 py-0.5 font-medium text-foreground text-xs shadow-none",
														user.athleteProfile.status === "active"
															? "bg-green-100 dark:bg-green-900"
															: "bg-gray-100 dark:bg-gray-800",
													)}
													variant="outline"
												>
													{capitalize(user.athleteProfile.status)}
												</Badge>
												<Link
													href={`/dashboard/organization/athletes?search=${encodeURIComponent(user.email)}`}
													className="text-muted-foreground hover:text-foreground"
												>
													<ExternalLinkIcon className="size-4" />
												</Link>
											</div>
										</div>
										<p className="mt-2 text-muted-foreground text-sm">
											Sport: {user.athleteProfile.sport} | Level:{" "}
											{capitalize(user.athleteProfile.level)}
										</p>
									</div>
								)}

								{!user.coachProfile && !user.athleteProfile && (
									<p className="text-muted-foreground text-sm">
										This user has no coach or athlete profile.
									</p>
								)}

								{/* Create Profile Buttons */}
								{(!user.coachProfile || !user.athleteProfile) && (
									<div className="flex flex-wrap gap-2 pt-2">
										{!user.coachProfile && (
											<Button
												variant="outline"
												size="sm"
												onClick={handleCreateCoachProfile}
											>
												<UserCheckIcon className="mr-2 size-4" />
												Create Coach Profile
											</Button>
										)}
										{!user.athleteProfile && (
											<Button
												variant="outline"
												size="sm"
												onClick={handleCreateAthleteProfile}
											>
												<MedalIcon className="mr-2 size-4" />
												Create Athlete Profile
											</Button>
										)}
									</div>
								)}
							</div>

							<Separator />

							{/* Change Role Form */}
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Change Role</h4>
								{user.coachProfile || user.athleteProfile ? (
									<p className="text-muted-foreground text-sm">
										Users with coach or athlete profiles cannot have their role
										manually changed. The role is automatically assigned based
										on their profile.
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
															<FormLabel>New Role</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger className="w-full">
																		<SelectValue placeholder="Select role" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	{assignableRoles.map((role) => (
																		<SelectItem key={role} value={role}>
																			{capitalize(role)}
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
						</div>
					</ScrollArea>

					<SheetFooter className="flex-row justify-end gap-2 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={modal.handleClose}
							disabled={isPending}
						>
							{user.coachProfile || user.athleteProfile ? "Close" : "Cancel"}
						</Button>
						{!user.coachProfile && !user.athleteProfile && (
							<Button
								type="button"
								onClick={onSubmit}
								disabled={isPending || form.watch("role") === user.role}
								loading={updateRoleMutation.isPending}
							>
								Update Role
							</Button>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>
		);
	});
