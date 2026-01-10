"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
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
		isActive: boolean;
	};
};

export const LocationsModal = NiceModal.create<LocationsModalProps>(
	({ location }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!location;

		const createLocationMutation =
			trpc.organization.location.create.useMutation({
				onSuccess: () => {
					toast.success("Location created successfully");
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to create location");
				},
			});

		const updateLocationMutation =
			trpc.organization.location.update.useMutation({
				onSuccess: () => {
					toast.success("Location updated successfully");
					utils.organization.location.list.invalidate();
					utils.organization.location.listActive.invalidate();
					modal.handleClose();
				},
				onError: (error) => {
					toast.error(error.message || "Failed to update location");
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
					className="sm:max-w-lg"
					onAnimationEndCapture={modal.handleAnimationEndCapture}
				>
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Edit Location" : "Create Location"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Update the location information below."
								: "Fill in the details to create a new location."}
						</SheetDescription>
					</SheetHeader>

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
													<FormLabel>Name</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g., Main Training Center"
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
													<FormLabel>Address</FormLabel>
													<FormControl>
														<Input
															placeholder="Street address"
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
														<FormLabel>City</FormLabel>
														<FormControl>
															<Input
																placeholder="City"
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
														<FormLabel>State/Province</FormLabel>
														<FormControl>
															<Input
																placeholder="State"
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
														<FormLabel>Country</FormLabel>
														<FormControl>
															<Input
																placeholder="Country"
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
														<FormLabel>Postal Code</FormLabel>
														<FormControl>
															<Input
																placeholder="Postal code"
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
													<FormLabel>Capacity</FormLabel>
													<FormControl>
														<Input
															type="number"
															placeholder="Maximum capacity"
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
													<FormLabel>Notes</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Additional notes about the location..."
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
										name="isActive"
										render={({ field }) => (
											<FormItem asChild>
												<Field className="flex-row items-center justify-between">
													<FormLabel>Active</FormLabel>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
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
									{isEditing ? "Update Location" : "Create Location"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
