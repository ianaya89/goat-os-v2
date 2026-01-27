"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import {
	CheckIcon,
	MapPinIcon,
	PaletteIcon,
	PlusIcon,
	XIcon,
} from "lucide-react";
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
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { LOCATION_COLOR_PALETTE } from "@/lib/utils/location-colors";
import {
	createLocationSchema,
	updateLocationSchema,
} from "@/schemas/organization-location-schemas";
import { trpc } from "@/trpc/client";

export type LocationsModalProps = NiceModalHocProps & {
	location?: {
		id: string;
		name: string;
		address?: string | null;
		city?: string | null;
		state?: string | null;
		country?: string | null;
		postalCode?: string | null;
		capacity?: number | null;
		notes?: string | null;
		color?: string | null;
		isActive: boolean;
	};
};

export const LocationsModal = NiceModal.create<LocationsModalProps>(
	({ location }) => {
		const t = useTranslations("locations");
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!location;

		const createLocationMutation =
			trpc.organization.location.create.useMutation({
				onSuccess: () => {
					toast.success(t("success.created"));
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.createFailed"));
				},
			});

		const updateLocationMutation =
			trpc.organization.location.update.useMutation({
				onSuccess: () => {
					toast.success(t("success.updated"));
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || t("error.updateFailed"));
				},
			});

		const form = useZodForm({
			schema: isEditing ? updateLocationSchema : createLocationSchema,
			defaultValues: isEditing
				? {
						id: location.id,
						name: location.name,
						address: location.address ?? "",
						city: location.city ?? "",
						state: location.state ?? "",
						country: location.country ?? "",
						postalCode: location.postalCode ?? "",
						capacity: location.capacity ?? undefined,
						notes: location.notes ?? "",
						color: location.color ?? undefined,
						isActive: location.isActive,
					}
				: {
						name: "",
						address: "",
						city: "",
						state: "",
						country: "",
						postalCode: "",
						capacity: undefined,
						notes: "",
						color: undefined,
						isActive: true,
					},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing) {
				updateLocationMutation.mutate(
					data as Parameters<typeof updateLocationMutation.mutate>[0],
				);
			} else {
				createLocationMutation.mutate(
					data as Parameters<typeof createLocationMutation.mutate>[0],
				);
			}
		});

		const isPending =
			createLocationMutation.isPending || updateLocationMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.handleClose()}
			>
				<SheetContent
					className="gap-0 overflow-hidden sm:max-w-lg"
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
									<MapPinIcon className="size-5" />
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
								<span className="sr-only">{t("modal.close")}</span>
							</button>
						</div>

						{/* Separator */}
						<div className="h-px bg-border" />
					</div>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex min-h-0 flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="min-h-0 flex-1">
								<div className="space-y-4 px-6 py-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.name")}</FormLabel>
													<FormControl>
														<Input
															placeholder={t("form.namePlaceholder")}
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
										name="address"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.address")}</FormLabel>
													<FormControl>
														<Input
															placeholder={t("form.addressPlaceholder")}
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="city"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.city")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.cityPlaceholder")}
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
											name="state"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.state")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.statePlaceholder")}
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
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="country"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.country")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.countryPlaceholder")}
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
											name="postalCode"
											render={({ field }) => (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.postalCode")}</FormLabel>
														<FormControl>
															<Input
																placeholder={t("form.postalCodePlaceholder")}
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
									</div>

									<FormField
										control={form.control}
										name="capacity"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.capacity")}</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder={t("form.capacityPlaceholder")}
															autoComplete="off"
															{...field}
															value={field.value ?? ""}
															onChange={(e) => {
																const value = e.target.value;
																field.onChange(
																	value === "" ? undefined : Number(value),
																);
															}}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>{t("form.notes")}</FormLabel>
													<FormControl>
														<Textarea
															placeholder={t("form.notesPlaceholder")}
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
										name="color"
										render={({ field }) => {
											const isCustomColor =
												field.value &&
												!LOCATION_COLOR_PALETTE.includes(
													field.value as (typeof LOCATION_COLOR_PALETTE)[number],
												);

											return (
												<FormItem asChild>
													<Field>
														<FormLabel>{t("form.calendarColor")}</FormLabel>
														<FormControl>
															<div className="flex items-center gap-2">
																{LOCATION_COLOR_PALETTE.map((color) => (
																	<button
																		key={color}
																		type="button"
																		className={cn(
																			"size-6 rounded-full border-2 transition-all hover:scale-110",
																			field.value === color
																				? "border-foreground ring-2 ring-offset-1 ring-foreground/30"
																				: "border-transparent hover:border-muted-foreground/40",
																		)}
																		style={{ backgroundColor: color }}
																		onClick={() => field.onChange(color)}
																	>
																		{field.value === color && (
																			<CheckIcon className="size-3 mx-auto text-white" />
																		)}
																	</button>
																))}
																<div className="relative">
																	<button
																		type="button"
																		className={cn(
																			"flex size-6 items-center justify-center rounded-full border-2 transition-all hover:scale-110",
																			isCustomColor
																				? "border-foreground ring-2 ring-offset-1 ring-foreground/30"
																				: "border-dashed border-muted-foreground/40 hover:border-muted-foreground",
																		)}
																		style={
																			isCustomColor && field.value
																				? { backgroundColor: field.value }
																				: undefined
																		}
																		onClick={() => {
																			const input = document.getElementById(
																				"location-color-input",
																			);
																			input?.click();
																		}}
																	>
																		{isCustomColor ? (
																			<CheckIcon className="size-3 text-white" />
																		) : (
																			<PaletteIcon className="size-3 text-muted-foreground" />
																		)}
																	</button>
																	<input
																		id="location-color-input"
																		type="color"
																		className="invisible absolute inset-0 size-0"
																		value={field.value || "#a8c5e2"}
																		onChange={(e) =>
																			field.onChange(e.target.value)
																		}
																	/>
																</div>
																{field.value && (
																	<button
																		type="button"
																		className="ml-1 text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
																		onClick={() => field.onChange(undefined)}
																	>
																		{t("modal.clear")}
																	</button>
																)}
															</div>
														</FormControl>
														<FormMessage />
													</Field>
												</FormItem>
											);
										}}
									/>

									<FormField
										control={form.control}
										name="isActive"
										render={({ field }) => (
											<FormItem>
												<div className="flex items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															{t("form.active")}
														</FormLabel>
														<p className="text-muted-foreground text-sm">
															{t("form.activeDescription")}
														</p>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</div>
											</FormItem>
										)}
									/>
								</div>
							</ScrollArea>

							<SheetFooter className="shrink-0 flex-row justify-end gap-3 border-t bg-muted/30 px-6 py-4">
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
