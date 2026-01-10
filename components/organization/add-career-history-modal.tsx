"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { BriefcaseIcon, CalendarIcon, FlagIcon, Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface FormValues {
	clubName: string;
	startDate: Date | undefined;
	endDate: Date | undefined;
	position: string;
	achievements: string;
	wasNationalTeam: boolean;
	nationalTeamLevel: string;
	notes: string;
}

interface AddCareerHistoryModalProps {
	athleteId: string;
}

export const AddCareerHistoryModal = NiceModal.create<AddCareerHistoryModalProps>(
	({ athleteId }) => {
		const modal = useModal();
		const utils = trpc.useUtils();

		const form = useForm<FormValues>({
			defaultValues: {
				clubName: "",
				startDate: undefined,
				endDate: undefined,
				position: "",
				achievements: "",
				wasNationalTeam: false,
				nationalTeamLevel: "",
				notes: "",
			},
		});

		const wasNationalTeam = form.watch("wasNationalTeam");

		const createMutation = trpc.organization.athlete.createCareerHistory.useMutation({
			onSuccess: () => {
				toast.success("Career history has been updated successfully.");
				utils.organization.athlete.getProfile.invalidate({ id: athleteId });
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		});

		const onSubmit = (values: FormValues) => {
			if (!values.clubName.trim()) {
				toast.error("Please enter a club name");
				return;
			}

			createMutation.mutate({
				athleteId,
				clubName: values.clubName,
				startDate: values.startDate,
				endDate: values.endDate,
				position: values.position || undefined,
				achievements: values.achievements || undefined,
				wasNationalTeam: values.wasNationalTeam,
				nationalTeamLevel: values.wasNationalTeam
					? values.nationalTeamLevel || undefined
					: undefined,
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
							<BriefcaseIcon className="size-5" />
							Add Career History
						</SheetTitle>
						<SheetDescription>
							Add a club or team to this athlete's career history.
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
							<FormField
								control={form.control}
								name="clubName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Club/Team Name *</FormLabel>
										<FormControl>
											<Input placeholder="River Plate, Barcelona FC..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Start Date</FormLabel>
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
																format(field.value, "MMM yyyy")
															) : (
																<span>Select...</span>
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
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="endDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>End Date</FormLabel>
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
																format(field.value, "MMM yyyy")
															) : (
																<span>Present</span>
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
															date > new Date() || date < new Date("1950-01-01")
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormDescription className="text-xs">
												Leave empty if current
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="position"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Position</FormLabel>
										<FormControl>
											<Input
												placeholder="Midfielder, Forward, Goalkeeper..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="wasNationalTeam"
								render={({ field }) => (
									<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1 leading-none">
											<FormLabel className="flex items-center gap-2">
												<FlagIcon className="size-4 text-yellow-600" />
												National Team
											</FormLabel>
											<FormDescription>
												Check if this was a national team selection
											</FormDescription>
										</div>
									</FormItem>
								)}
							/>

							{wasNationalTeam && (
								<FormField
									control={form.control}
									name="nationalTeamLevel"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Team Level</FormLabel>
											<FormControl>
												<Input
													placeholder="U17, U20, Senior..."
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-xs">
												Age category or team level
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="achievements"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Achievements</FormLabel>
										<FormControl>
											<Textarea
												placeholder="League champion 2024, Top scorer, MVP..."
												className="resize-none"
												rows={2}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Additional notes..."
												className="resize-none"
												rows={2}
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
									Add to History
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	}
);
