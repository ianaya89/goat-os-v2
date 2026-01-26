"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Loader2Icon, RulerIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";

interface FormValues {
	height: string;
	weight: string;
	bodyFatPercentage: string;
	muscleMass: string;
	wingspan: string;
	standingReach: string;
	notes: string;
}

interface AddPhysicalMetricsModalProps {
	athleteId: string;
}

export const AddPhysicalMetricsModal =
	NiceModal.create<AddPhysicalMetricsModalProps>(({ athleteId }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const form = useForm<FormValues>({
			defaultValues: {
				height: "",
				weight: "",
				bodyFatPercentage: "",
				muscleMass: "",
				wingspan: "",
				standingReach: "",
				notes: "",
			},
		});

		const createMutation =
			trpc.organization.athlete.createPhysicalMetrics.useMutation({
				onSuccess: () => {
					toast.success("Physical metrics have been recorded successfully.");
					utils.organization.athlete.getProfile.invalidate({ id: athleteId });
					modal.hide();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = (values: FormValues) => {
			const height = values.height ? parseInt(values.height, 10) : undefined;
			const weight = values.weight
				? Math.round(parseFloat(values.weight) * 1000)
				: undefined;
			const bodyFatPercentage = values.bodyFatPercentage
				? Math.round(parseFloat(values.bodyFatPercentage) * 10)
				: undefined;
			const muscleMass = values.muscleMass
				? Math.round(parseFloat(values.muscleMass) * 1000)
				: undefined;
			const wingspan = values.wingspan
				? parseInt(values.wingspan, 10)
				: undefined;
			const standingReach = values.standingReach
				? parseInt(values.standingReach, 10)
				: undefined;

			createMutation.mutate({
				athleteId,
				height,
				weight,
				bodyFatPercentage,
				muscleMass,
				wingspan,
				standingReach,
				notes: values.notes || undefined,
			});
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="overflow-y-auto sm:max-w-lg">
					<SheetHeader>
						<SheetTitle className="flex items-center gap-2">
							<RulerIcon className="size-5" />
							Add Physical Measurement
						</SheetTitle>
						<SheetDescription>
							Record physical metrics for this athlete. All fields are optional.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="mt-6 space-y-4"
						>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="height"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Height (cm)</FormLabel>
											<FormControl>
												<Input type="number" placeholder="175" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="weight"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Weight (kg)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="72.5"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="bodyFatPercentage"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Body Fat %</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="12.5"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="muscleMass"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Muscle Mass (kg)</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.1"
													placeholder="35.2"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="wingspan"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Wingspan (cm)</FormLabel>
											<FormControl>
												<Input type="number" placeholder="180" {...field} />
											</FormControl>
											<FormDescription className="text-xs">
												Arm span measurement
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="standingReach"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Standing Reach (cm)</FormLabel>
											<FormControl>
												<Input type="number" placeholder="230" {...field} />
											</FormControl>
											<FormDescription className="text-xs">
												Max reach while standing
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Additional notes about this measurement..."
												className="resize-none"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<SheetFooter className="mt-6">
								<Button
									type="button"
									variant="outline"
									onClick={() => modal.hide()}
									disabled={createMutation.isPending}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending && (
										<Loader2Icon className="mr-2 size-4 animate-spin" />
									)}
									Save Measurement
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
