"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { CalendarIcon, ShieldBanIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { banOrganizationUserSchema } from "@/schemas/organization-user-schemas";
import { trpc } from "@/trpc/client";

export type OrganizationBanUserModalProps = NiceModalHocProps & {
	userId: string;
	userName: string;
};

export const OrganizationBanUserModal =
	NiceModal.create<OrganizationBanUserModalProps>(({ userId, userName }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const t = useTranslations("users");

		const form = useZodForm({
			schema: banOrganizationUserSchema,
			defaultValues: {
				userId,
				reason: "",
				expiresAt: undefined,
			},
		});

		const banUserMutation = trpc.organization.user.ban.useMutation({
			onSuccess: () => {
				toast.success(t("success.banned"));
				utils.organization.user.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || t("error.banFailed"));
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			banUserMutation.mutate(data);
		});

		const isPending = banUserMutation.isPending;

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
					<SheetTitle className="sr-only">{t("ban.title")}</SheetTitle>
					{/* Custom Header with accent stripe */}
					<div className="relative shrink-0">
						<div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-400 to-red-500" />

						<div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-500 text-white shadow-sm">
									<ShieldBanIcon className="size-5" />
								</div>
								<div>
									<h2 className="font-semibold text-lg tracking-tight">
										{t("ban.title")}
									</h2>
									<p className="mt-0.5 text-muted-foreground text-sm">
										{t("ban.description", { name: userName })}
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
							<div className="flex-1 space-y-4 px-6 py-4">
								<FormField
									control={form.control}
									name="reason"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("ban.reason")}</FormLabel>
												<FormControl>
													<Textarea
														placeholder={t("ban.reasonPlaceholder")}
														className="resize-none"
														rows={3}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													{t("ban.reasonDescription")}
												</FormDescription>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="expiresAt"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>{t("ban.expiresAt")}</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant="outline"
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value && "text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(field.value, "PPP")
																) : (
																	<span>{t("ban.pickDate")}</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0" align="start">
														<Calendar
															mode="single"
															selected={field.value}
															onSelect={field.onChange}
															disabled={(date) =>
																date < new Date() ||
																date < new Date("1900-01-01")
															}
														/>
													</PopoverContent>
												</Popover>
												<FormDescription>
													{t("ban.expiresDescription")}
												</FormDescription>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
							</div>

							<SheetFooter className="flex-row justify-end gap-3">
								<Button
									type="button"
									variant="ghost"
									onClick={modal.handleClose}
									disabled={isPending}
									className="min-w-[100px]"
								>
									<XIcon className="size-4" />
									{t("ban.cancel")}
								</Button>
								<Button
									type="submit"
									variant="destructive"
									disabled={isPending}
									loading={isPending}
									className="min-w-[100px]"
								>
									<ShieldBanIcon className="size-4" />
									{isPending ? t("ban.banning") : t("ban.confirm")}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
