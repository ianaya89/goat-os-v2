"use client";

import NiceModal from "@ebay/nice-modal-react";
import { useQueryClient } from "@tanstack/react-query";
import {
	CheckIcon,
	ChevronsUpDownIcon,
	PlusIcon,
	ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { CreateOrganizationModal } from "@/components/organization/create-organization-modal";
import { OrganizationLogo } from "@/components/organization/organization-logo";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalAccountAvatar } from "@/components/user/personal-account-avatar";
import { appConfig } from "@/config/app.config";
import { useProgressRouter } from "@/hooks/use-progress-router";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { clearOrganizationScopedQueries } from "@/trpc/query-client";

export type OrganizationSwitcherProps = {
	variant?: "sidebar" | "topbar" | "breadcrumb";
};

/**
 * Organization switcher component that uses Better Auth's activeOrganization.
 * When switching organizations, it calls setActive() to update the session,
 * then navigates to the organization's dashboard.
 */
export function OrganizationSwitcher({
	variant = "sidebar",
}: OrganizationSwitcherProps): React.JSX.Element | null {
	const { user } = useSession();
	const router = useProgressRouter();
	const pathname = usePathname();
	const queryClient = useQueryClient();
	const { data: activeOrganization, isPending: isActiveOrgPending } =
		authClient.useActiveOrganization();
	const { data: allOrganizations, isLoading: isOrgsLoading } =
		trpc.organization.list.useQuery();
	// useSidebar is safe to call - SidebarProvider wraps the entire dashboard layout
	const { state: sidebarState } = useSidebar();
	const isAdminArea = pathname?.startsWith("/dashboard/admin");
	const isOrganizationArea = pathname?.startsWith("/dashboard/organization");
	const isPersonalArea = !isAdminArea && !isOrganizationArea;

	const [open, setOpen] = React.useState(false);
	const [selectedValue, setSelectedValue] = React.useState<string>("");

	// Track if we've ever loaded data to distinguish initial load from refetch
	const hasLoadedOrgsRef = React.useRef(false);
	const hasLoadedActiveOrgRef = React.useRef(false);

	React.useEffect(() => {
		if (allOrganizations !== undefined) {
			hasLoadedOrgsRef.current = true;
		}
	}, [allOrganizations]);

	React.useEffect(() => {
		// activeOrganization can be null (no active org) or an object
		// isPending being false means we've loaded
		if (!isActiveOrgPending) {
			hasLoadedActiveOrgRef.current = true;
		}
	}, [isActiveOrgPending]);

	React.useEffect(() => {
		if (open) {
			setSelectedValue(activeOrganization?.id ?? user?.id ?? "");
		}
	}, [open, activeOrganization, user]);

	const handleSelectOrganization = async (organizationId: string) => {
		try {
			// Set the active organization in Better Auth session
			await authClient.organization.setActive({
				organizationId,
			});
			// Clear only organization-scoped queries to prevent stale data from previous org
			// while preserving user-level queries (like organizations list) to avoid flickering
			clearOrganizationScopedQueries(queryClient);
			// Navigate to the organization dashboard
			router.push("/dashboard/organization");
		} catch (error) {
			// Log the error for debugging but don't expose details to user
			console.error("Failed to switch organization:", error);
			// Keep popover open so user can retry
			return;
		}
		setOpen(false);
	};

	const handleSelectPersonalAccount = async () => {
		try {
			// Unset the active organization
			await authClient.organization.setActive({
				organizationId: null,
			});
			// Clear only organization-scoped queries when leaving organization context
			// while preserving user-level queries to avoid flickering
			clearOrganizationScopedQueries(queryClient);
			router.replace("/dashboard");
		} catch (error) {
			// Log the error for debugging but don't expose details to user
			console.error("Failed to switch to personal account:", error);
			// Keep popover open so user can retry
			return;
		}
		setOpen(false);
	};

	const Icon = (props: { type: "personal" | "organization"; id?: string }) => {
		const isChecked =
			props.type === "personal"
				? isPersonalArea
				: isOrganizationArea && activeOrganization?.id === props.id;
		return (
			<div
				className={cn(
					"ml-auto flex size-4 items-center justify-center rounded-full text-primary-foreground",
					isChecked ? "bg-blue-500" : "bg-transparent",
				)}
			>
				<CheckIcon
					className={cn(
						"size-3 shrink-0 text-current",
						isChecked ? "opacity-100" : "opacity-0",
					)}
				/>
			</div>
		);
	};

	// Only show loading skeleton on initial load, not on refetch
	const isInitialLoading =
		(isOrgsLoading && !hasLoadedOrgsRef.current) ||
		(isActiveOrgPending && !hasLoadedActiveOrgRef.current);

	const currentLabel = isAdminArea
		? "Admin Panel"
		: activeOrganization && isOrganizationArea
			? activeOrganization.name
			: "Personal";

	const CurrentIcon = () => {
		if (isAdminArea) {
			return (
				<div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
					<ShieldIcon className="size-4" />
				</div>
			);
		}
		if (activeOrganization && isOrganizationArea) {
			return (
				<OrganizationLogo
					className="size-6"
					name={activeOrganization.name}
					src={activeOrganization.logo}
				/>
			);
		}
		return <PersonalAccountAvatar className="size-6" />;
	};

	if (isInitialLoading || !user) {
		if (variant === "breadcrumb") {
			return (
				<div className="flex items-center gap-1.5">
					<Skeleton className="size-4 rounded bg-muted" />
					<Skeleton className="h-3.5 w-20 rounded bg-muted" />
				</div>
			);
		}
		if (variant === "topbar") {
			return (
				<div className="flex h-9 w-32 items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3">
					<Skeleton className="size-5 rounded-md bg-muted" />
					<Skeleton className="h-3 flex-1 rounded bg-muted" />
				</div>
			);
		}
		if (sidebarState === "collapsed") {
			return (
				<div className="flex h-[44px] w-9 items-center justify-center rounded-md p-2">
					<Skeleton className="size-5 rounded-md bg-muted" />
				</div>
			);
		}
		return (
			<div className="-mt-1 ml-0.5 flex h-12 w-full items-center gap-2 rounded-md p-2">
				<Skeleton className="size-8 rounded-md bg-muted" />
				<Skeleton className="h-4 flex-1 rounded bg-muted" />
				<Skeleton className="ml-auto h-4 w-4 rounded bg-muted" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	// Hide the switcher if user has no organizations (only personal account)
	const hasOrganizations =
		Array.isArray(allOrganizations) && allOrganizations.length > 0;
	if (!hasOrganizations && !isAdminArea && user.role !== "admin") {
		return null;
	}

	// Topbar variant - compact button style
	if (variant === "topbar") {
		return (
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						aria-expanded={open}
						className="h-9 gap-2 rounded-lg border-border/50 bg-background/50 px-3 hover:bg-background/80"
					>
						<CurrentIcon />
						<span className="max-w-[120px] truncate font-medium text-sm">
							{currentLabel}
						</span>
						<ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-60 p-0" forceMount>
					<Command onValueChange={setSelectedValue} value={selectedValue}>
						<CommandInput className="h-9" placeholder="Search..." />
						<CommandList>
							<CommandGroup>
								<CommandItem
									className="cursor-pointer"
									onSelect={handleSelectPersonalAccount}
									value={user.id}
								>
									<PersonalAccountAvatar className="size-5 shrink-0" />
									<span className="mr-2">Personal</span>
									<Icon type="personal" />
								</CommandItem>
							</CommandGroup>
							{Array.isArray(allOrganizations) &&
								allOrganizations.length > 0 && (
									<>
										<CommandSeparator />
										<CommandGroup
											heading={`Your Organizations (${allOrganizations.length})`}
										>
											{allOrganizations.map((organization) => (
												<CommandItem
													className={cn(
														"group my-1 flex cursor-pointer justify-between transition-colors",
														{
															"bg-muted":
																isOrganizationArea &&
																activeOrganization?.id === organization.id,
														},
													)}
													key={organization.id}
													onSelect={() =>
														handleSelectOrganization(organization.id)
													}
													value={organization.id}
												>
													<div className="flex items-center">
														<OrganizationLogo
															className="mr-2 size-5 shrink-0"
															name={organization.name}
															src={organization.logo}
														/>
														<span className="mr-2 max-w-[165px] truncate">
															{organization.name}
														</span>
													</div>
													<Icon id={organization.id} type="organization" />
												</CommandItem>
											))}
										</CommandGroup>
									</>
								)}
						</CommandList>
					</Command>
					<div className="space-y-1 p-1">
						{user?.role === "admin" && (
							<>
								<Separator />
								<Button
									asChild
									className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
									size="sm"
									variant="ghost"
								>
									<Link
										href="/dashboard/admin/users"
										onClick={() => setOpen(false)}
										className="flex items-center"
									>
										<div className="mr-0.75 -ml-0.75 flex size-5 items-center justify-center rounded-md bg-foreground text-background">
											<ShieldIcon className="size-3 shrink-0" />
										</div>
										<span className="flex-1">Admin Panel</span>
										<div
											className={cn(
												"ml-auto flex size-4 items-center justify-center rounded-full text-primary-foreground",
												isAdminArea ? "bg-blue-500" : "bg-transparent",
											)}
										>
											<CheckIcon
												className={cn(
													"size-3 shrink-0 text-current",
													isAdminArea ? "opacity-100" : "opacity-0",
												)}
											/>
										</div>
									</Link>
								</Button>
							</>
						)}
						{appConfig.organizations.allowUserCreation && (
							<>
								<Separator />
								<Button
									className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
									onClick={() => {
										NiceModal.show(CreateOrganizationModal);
										setOpen(false);
									}}
									size="sm"
									variant="ghost"
								>
									<PlusIcon className="size-5 shrink-0" />
									<span>Create an Organization</span>
								</Button>
							</>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// Breadcrumb variant - inline style for breadcrumb integration
	if (variant === "breadcrumb") {
		return (
			<Popover onOpenChange={setOpen} open={open}>
				<PopoverTrigger asChild>
					<button
						type="button"
						aria-expanded={open}
						className="group flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<OrganizationLogo
							className="size-4"
							name={activeOrganization?.name ?? ""}
							src={activeOrganization?.logo}
						/>
						<span className="font-medium text-sm text-foreground/80 group-hover:text-foreground">
							{activeOrganization?.name ?? "Organization"}
						</span>
						<ChevronsUpDownIcon className="size-3 text-muted-foreground/60 group-hover:text-muted-foreground" />
					</button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-60 p-0" forceMount>
					<Command onValueChange={setSelectedValue} value={selectedValue}>
						<CommandInput className="h-9" placeholder="Search..." />
						<CommandList>
							<CommandGroup>
								<CommandItem
									className="cursor-pointer"
									onSelect={handleSelectPersonalAccount}
									value={user.id}
								>
									<PersonalAccountAvatar className="size-5 shrink-0" />
									<span className="mr-2">Personal</span>
									<Icon type="personal" />
								</CommandItem>
							</CommandGroup>
							{Array.isArray(allOrganizations) &&
								allOrganizations.length > 0 && (
									<>
										<CommandSeparator />
										<CommandGroup
											heading={`Your Organizations (${allOrganizations.length})`}
										>
											{allOrganizations.map((organization) => (
												<CommandItem
													className={cn(
														"group my-1 flex cursor-pointer justify-between transition-colors",
														{
															"bg-muted":
																isOrganizationArea &&
																activeOrganization?.id === organization.id,
														},
													)}
													key={organization.id}
													onSelect={() =>
														handleSelectOrganization(organization.id)
													}
													value={organization.id}
												>
													<div className="flex items-center">
														<OrganizationLogo
															className="mr-2 size-5 shrink-0"
															name={organization.name}
															src={organization.logo}
														/>
														<span className="mr-2 max-w-[165px] truncate">
															{organization.name}
														</span>
													</div>
													<Icon id={organization.id} type="organization" />
												</CommandItem>
											))}
										</CommandGroup>
									</>
								)}
						</CommandList>
					</Command>
					<div className="space-y-1 p-1">
						{user?.role === "admin" && (
							<>
								<Separator />
								<Button
									asChild
									className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
									size="sm"
									variant="ghost"
								>
									<Link
										href="/dashboard/admin/users"
										onClick={() => setOpen(false)}
										className="flex items-center"
									>
										<div className="mr-0.75 -ml-0.75 flex size-5 items-center justify-center rounded-md bg-foreground text-background">
											<ShieldIcon className="size-3 shrink-0" />
										</div>
										<span className="flex-1">Admin Panel</span>
										<div
											className={cn(
												"ml-auto flex size-4 items-center justify-center rounded-full text-primary-foreground",
												isAdminArea ? "bg-blue-500" : "bg-transparent",
											)}
										>
											<CheckIcon
												className={cn(
													"size-3 shrink-0 text-current",
													isAdminArea ? "opacity-100" : "opacity-0",
												)}
											/>
										</div>
									</Link>
								</Button>
							</>
						)}
						{appConfig.organizations.allowUserCreation && (
							<>
								<Separator />
								<Button
									className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
									onClick={() => {
										NiceModal.show(CreateOrganizationModal);
										setOpen(false);
									}}
									size="sm"
									variant="ghost"
								>
									<PlusIcon className="size-5 shrink-0" />
									<span>Create an Organization</span>
								</Button>
							</>
						)}
					</div>
				</PopoverContent>
			</Popover>
		);
	}

	// Sidebar variant - full sidebar menu style
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<Popover onOpenChange={setOpen} open={open}>
					<PopoverTrigger asChild>
						<SidebarMenuButton
							aria-expanded={open}
							className="-mt-1 p-2 transition-none group-data-[collapsible=icon]:ml-1.5 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:bg-transparent!"
							size="lg"
						>
							<div className="flex w-full items-center gap-2 overflow-hidden">
								<CurrentIcon />
								<div className="flex flex-1 flex-col items-start gap-0.5 overflow-hidden text-left">
									<span className="block w-full truncate font-semibold leading-none">
										{currentLabel}
									</span>
								</div>
								<ChevronsUpDownIcon className="ml-auto block size-4 shrink-0 text-sidebar-foreground/70" />
							</div>
						</SidebarMenuButton>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-60 p-0" forceMount>
						<Command onValueChange={setSelectedValue} value={selectedValue}>
							<CommandInput className="h-9" placeholder="Search..." />
							<CommandList>
								<CommandGroup>
									<CommandItem
										className="cursor-pointer"
										onSelect={handleSelectPersonalAccount}
										value={user.id}
									>
										<PersonalAccountAvatar className="size-5 shrink-0" />
										<span className="mr-2">Personal</span>
										<Icon type="personal" />
									</CommandItem>
								</CommandGroup>
								{Array.isArray(allOrganizations) &&
									allOrganizations.length > 0 && (
										<>
											<CommandSeparator />
											<CommandGroup
												heading={`Your Organizations (${allOrganizations.length})`}
											>
												{allOrganizations.map((organization) => (
													<CommandItem
														className={cn(
															"group my-1 flex cursor-pointer justify-between transition-colors",
															{
																"bg-muted":
																	isOrganizationArea &&
																	activeOrganization?.id === organization.id,
															},
														)}
														key={organization.id}
														onSelect={() =>
															handleSelectOrganization(organization.id)
														}
														value={organization.id}
													>
														<div className="flex items-center">
															<OrganizationLogo
																className="mr-2 size-5 shrink-0"
																name={organization.name}
																src={organization.logo}
															/>
															<span className="mr-2 max-w-[165px] truncate">
																{organization.name}
															</span>
														</div>
														<Icon id={organization.id} type="organization" />
													</CommandItem>
												))}
											</CommandGroup>
										</>
									)}
							</CommandList>
						</Command>
						<div className="space-y-1 p-1">
							{user?.role === "admin" && (
								<>
									<Separator />
									<Button
										asChild
										className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
										size="sm"
										variant="ghost"
									>
										<Link
											href="/dashboard/admin/users"
											onClick={() => setOpen(false)}
											className="flex items-center"
										>
											<div className="mr-0.75 -ml-0.75 flex size-5 items-center justify-center rounded-md bg-foreground text-background">
												<ShieldIcon className="size-3 shrink-0" />
											</div>
											<span className="flex-1">Admin Panel</span>
											<div
												className={cn(
													"ml-auto flex size-4 items-center justify-center rounded-full text-primary-foreground",
													isAdminArea ? "bg-blue-500" : "bg-transparent",
												)}
											>
												<CheckIcon
													className={cn(
														"size-3 shrink-0 text-current",
														isAdminArea ? "opacity-100" : "opacity-0",
													)}
												/>
											</div>
										</Link>
									</Button>
								</>
							)}
							{appConfig.organizations.allowUserCreation && (
								<>
									<Separator />
									<Button
										className="h-8 w-full justify-start gap-1.5 font-normal text-sm"
										onClick={() => {
											NiceModal.show(CreateOrganizationModal);
											setOpen(false);
										}}
										size="sm"
										variant="ghost"
									>
										<PlusIcon className="size-5 shrink-0" />
										<span>Create an Organization</span>
									</Button>
								</>
							)}
						</div>
					</PopoverContent>
				</Popover>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
