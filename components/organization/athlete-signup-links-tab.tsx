"use client";

import {
	CheckIcon,
	CopyIcon,
	LinkIcon,
	PlusIcon,
	Trash2Icon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn, getBaseUrl } from "@/lib/utils";
import { createAthleteSignupLinkSchema } from "@/schemas/organization-athlete-signup-link-schemas";
import { trpc } from "@/trpc/client";

const NO_GROUP_VALUE = "__none__";

export function AthleteSignupLinksTab(): React.JSX.Element {
	const t = useTranslations("organization.settings.signupLinks");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
	const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data: links, isLoading } =
		trpc.organization.athleteSignupLink.list.useQuery({
			limit: 50,
			offset: 0,
		});

	const { data: groups } = trpc.organization.athleteGroup.list.useQuery({
		limit: 100,
		offset: 0,
		filters: { isActive: true },
	});

	const createMutation = trpc.organization.athleteSignupLink.create.useMutation(
		{
			onSuccess: () => {
				toast.success(t("created"));
				setShowCreateDialog(false);
				utils.organization.athleteSignupLink.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		},
	);

	const updateMutation = trpc.organization.athleteSignupLink.update.useMutation(
		{
			onSuccess: () => {
				toast.success(t("updated"));
				utils.organization.athleteSignupLink.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		},
	);

	const deleteMutation = trpc.organization.athleteSignupLink.delete.useMutation(
		{
			onSuccess: () => {
				toast.success(t("deleted"));
				setDeletingLinkId(null);
				utils.organization.athleteSignupLink.list.invalidate();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		},
	);

	const form = useZodForm({
		schema: createAthleteSignupLinkSchema,
		defaultValues: {
			name: "",
			athleteGroupId: null,
			isActive: true,
		},
	});

	const handleCreate = form.handleSubmit((data) => {
		createMutation.mutate({
			name: data.name,
			athleteGroupId: data.athleteGroupId || null,
			isActive: data.isActive,
		});
	});

	const handleToggle = (linkId: string, isActive: boolean) => {
		updateMutation.mutate({ id: linkId, isActive });
	};

	const handleCopyUrl = async (linkId: string, token: string) => {
		const url = `${getBaseUrl()}/athlete-signup?token=${token}`;
		await navigator.clipboard.writeText(url);
		setCopiedTokenId(linkId);
		toast.success(t("copied"));
		setTimeout(() => setCopiedTokenId(null), 2000);
	};

	const handleDelete = (linkId: string) => {
		deleteMutation.mutate({ id: linkId });
	};

	const getSignupUrl = (token: string) => {
		const base = getBaseUrl();
		return `${base}/athlete-signup?token=${token}`;
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div>
							<CardTitle>{t("title")}</CardTitle>
							<CardDescription className="mt-1">
								{t("description")}
							</CardDescription>
						</div>
						<Button
							size="sm"
							className="shrink-0"
							onClick={() => {
								form.reset({
									name: "",
									athleteGroupId: null,
									isActive: true,
								});
								setShowCreateDialog(true);
							}}
						>
							<PlusIcon className="mr-2 size-4" />
							{t("create")}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
						</div>
					) : !links || links.length === 0 ? (
						<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-muted">
								<LinkIcon className="size-6 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="font-medium text-sm">{t("noLinks")}</p>
								<p className="max-w-[280px] text-xs text-muted-foreground">
									{t("noLinksDescription")}
								</p>
							</div>
						</div>
					) : (
						<div className="divide-y rounded-lg border">
							{links.map((link) => (
								<div
									key={link.id}
									className={cn(
										"flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center",
										!link.isActive && "bg-muted/30",
									)}
								>
									{/* Content */}
									<div className="min-w-0 flex-1 space-y-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<p
												className={cn(
													"font-medium text-sm",
													!link.isActive && "text-muted-foreground",
												)}
											>
												{link.name}
											</p>
											{link.athleteGroup ? (
												<Badge
													variant="secondary"
													className="shrink-0 gap-1 text-[11px]"
												>
													<UsersIcon className="size-3" />
													{link.athleteGroup.name}
												</Badge>
											) : (
												<Badge
													variant="outline"
													className="shrink-0 text-[11px]"
												>
													{t("orgOnly")}
												</Badge>
											)}
											<Badge
												variant={link.isActive ? "default" : "secondary"}
												className={cn(
													"shrink-0 text-[10px] uppercase tracking-wider",
													link.isActive
														? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
														: "border-none",
												)}
											>
												{link.isActive ? t("active") : t("inactive")}
											</Badge>
										</div>
										{/* URL preview */}
										<button
											type="button"
											onClick={() => handleCopyUrl(link.id, link.token)}
											className="group flex max-w-full cursor-pointer items-center gap-1.5"
										>
											<code className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors group-hover:bg-muted/80 group-hover:text-foreground">
												{getSignupUrl(link.token)}
											</code>
											<CopyIcon className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
										</button>
										{/* Metadata */}
										<p className="text-[11px] text-muted-foreground">
											{t("usageCount", { count: link.usageCount })}
										</p>
									</div>

									{/* Actions */}
									<div className="flex shrink-0 items-center gap-2">
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center">
													<Switch
														checked={link.isActive}
														onCheckedChange={(checked) =>
															handleToggle(link.id, checked)
														}
														aria-label={
															link.isActive ? t("active") : t("inactive")
														}
													/>
												</div>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												{link.isActive ? t("active") : t("inactive")}
											</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
													onClick={() => setDeletingLinkId(link.id)}
												>
													<Trash2Icon className="size-3.5" />
												</Button>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												{t("delete")}
											</TooltipContent>
										</Tooltip>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("createDialog.title")}</DialogTitle>
						<DialogDescription>
							{t("createDialog.description")}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={handleCreate} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("name")}</FormLabel>
											<FormControl>
												<Input placeholder={t("namePlaceholder")} {...field} />
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="athleteGroupId"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FormLabel>{t("group")}</FormLabel>
											<Select
												value={field.value ?? NO_GROUP_VALUE}
												onValueChange={(value) =>
													field.onChange(
														value === NO_GROUP_VALUE ? null : value,
													)
												}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value={NO_GROUP_VALUE}>
														{t("groupNone")}
													</SelectItem>
													{groups?.groups?.map((group) => (
														<SelectItem key={group.id} value={group.id}>
															{group.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowCreateDialog(false)}
								>
									{t("cancel")}
								</Button>
								<Button type="submit" loading={createMutation.isPending}>
									{t("create")}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deletingLinkId}
				onOpenChange={(open) => !open && setDeletingLinkId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingLinkId && handleDelete(deletingLinkId)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
