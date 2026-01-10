"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { ActivityIcon, CalendarIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { FitnessTestType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const fitnessTestOptions = [
	{ value: FitnessTestType.sprint40m, label: "40m Sprint", unit: "seconds" },
	{ value: FitnessTestType.sprint60m, label: "60m Sprint", unit: "seconds" },
	{ value: FitnessTestType.sprint100m, label: "100m Sprint", unit: "seconds" },
	{ value: FitnessTestType.verticalJump, label: "Vertical Jump", unit: "cm" },
	{ value: FitnessTestType.standingLongJump, label: "Standing Long Jump", unit: "cm" },
	{ value: FitnessTestType.yoYoTest, label: "Yo-Yo Test", unit: "level" },
	{ value: FitnessTestType.beepTest, label: "Beep Test", unit: "level" },
	{ value: FitnessTestType.cooperTest, label: "Cooper Test (12min)", unit: "meters" },
	{ value: FitnessTestType.agilityTTest, label: "Agility T-Test", unit: "seconds" },
	{ value: FitnessTestType.illinoisAgility, label: "Illinois Agility", unit: "seconds" },
	{ value: FitnessTestType.maxSpeed, label: "Max Speed", unit: "km/h" },
	{ value: FitnessTestType.reactionTime, label: "Reaction Time", unit: "ms" },
	{ value: FitnessTestType.flexibility, label: "Flexibility (Sit & Reach)", unit: "cm" },
	{ value: FitnessTestType.plankHold, label: "Plank Hold", unit: "seconds" },
	{ value: FitnessTestType.pushUps, label: "Push Ups (1 min)", unit: "reps" },
	{ value: FitnessTestType.sitUps, label: "Sit Ups (1 min)", unit: "reps" },
	{ value: FitnessTestType.other, label: "Other", unit: "custom" },
];

interface FormValues {
	testType: FitnessTestType;
	testDate: Date;
	result: string;
	unit: string;
	notes: string;
}

interface AddFitnessTestModalProps {
	athleteId: string;
}

export const AddFitnessTestModal = NiceModal.create<AddFitnessTestModalProps>(
	({ athleteId }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const form = useForm<FormValues>({
			defaultValues: {
				testType: FitnessTestType.sprint40m,
				testDate: new Date(),
				result: "",
				unit: "seconds",
				notes: "",
			},
		});

		const selectedTestType = form.watch("testType");

		// Update unit when test type changes
		const handleTestTypeChange = (value: FitnessTestType) => {
			form.setValue("testType", value);
			const option = fitnessTestOptions.find((o) => o.value === value);
			if (option && option.unit !== "custom") {
				form.setValue("unit", option.unit);
			}
		};

		const createMutation = trpc.organization.athlete.createFitnessTest.useMutation({
			onSuccess: () => {
				toast.success("Fitness test result has been saved successfully.");
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = (values: FormValues) => {
			const result = parseInt(values.result, 10);
			if (isNaN(result)) {
				toast.error("Please enter a valid result number");
				return;
			}

			createMutation.mutate({
				athleteId,
				testType: values.testType,
				testDate: values.testDate,
				result,
				unit: values.unit,
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
							<ActivityIcon className="size-5" />
							Add Fitness Test
						</SheetTitle>
						<SheetDescription>
							Record a fitness test result for this athlete.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
							<FormField
								control={form.control}
								name="testType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Test Type</FormLabel>
										<Select
											value={field.value}
											onValueChange={handleTestTypeChange}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a test type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{fitnessTestOptions.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="testDate"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Test Date</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														className={cn(
															"w-full pl-3 text-left font-normal",
															!field.value && "text-muted-foreground"
														)}
													>
														{field.value ? (
															format(field.value, "PPP")
														) : (
															<span>Pick a date</span>
														)}
														<CalendarIcon className="ml-auto size-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date("1900-01-01")
													}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="result"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Result</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Enter value"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-xs">
												Numeric result value
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="unit"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Unit</FormLabel>
											<FormControl>
												<Input
													placeholder="seconds, cm, reps..."
													{...field}
													disabled={selectedTestType !== FitnessTestType.other}
												/>
											</FormControl>
											<FormDescription className="text-xs">
												{selectedTestType === FitnessTestType.other
													? "Enter custom unit"
													: "Auto-filled"}
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
												placeholder="Additional notes about this test..."
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
									Save Test Result
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	}
);
