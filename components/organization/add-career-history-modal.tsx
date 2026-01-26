"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import {
	BriefcaseIcon,
	CalendarIcon,
	FlagIcon,
	Loader2Icon,
	MapPinIcon,
	TrophyIcon,
	UserIcon,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const AddCareerHistoryModal =
	NiceModal.create<AddCareerHistoryModalProps>(({ athleteId }) => {
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

		const createMutation =
			trpc.organization.athlete.createCareerHistory.useMutation({
				onSuccess: () => {
					toast.success("Career history added successfully");
					utils.organization.athlete.getProfile.invalidate({ id: athleteId });
					modal.hide();
				},
				onError: (error) => {
					toast.error(error.message);
				},
			});

		const onSubmit = (values: FormValues) => {
			if (!values.clubName.trim()) {
				toast.error("Please enter a team name");
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

		const handleTabChange = (value: string) => {
			form.setValue("wasNationalTeam", value === "national");
			form.setValue("clubName", "");
			form.setValue("nationalTeamLevel", "");
		};

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="sm:max-w-lg p-0 flex flex-col">
					{/* Header */}
					<div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
						<SheetHeader>
							<SheetTitle className="flex items-center gap-2 text-xl">
								<div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
									<BriefcaseIcon className="size-5 text-primary" />
								</div>
								Add Career History
							</SheetTitle>
						</SheetHeader>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex-1 flex flex-col overflow-hidden"
						>
							<div className="flex-1 overflow-y-auto px-6 py-4">
								{/* Type Selector */}
								<Tabs
									defaultValue={wasNationalTeam ? "national" : "club"}
									onValueChange={handleTabChange}
									className="mb-6"
								>
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="club" className="gap-2">
											<BriefcaseIcon className="size-4" />
											Club / Team
										</TabsTrigger>
										<TabsTrigger value="national" className="gap-2">
											<FlagIcon className="size-4" />
											National Team
										</TabsTrigger>
									</TabsList>

									<TabsContent value="club" className="mt-4 space-y-4">
										<FormField
											control={form.control}
											name="clubName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<BriefcaseIcon className="size-4 text-muted-foreground" />
														Club / Team Name
													</FormLabel>
													<FormControl>
														<Input
															placeholder="River Plate, Barcelona FC, LA Lakers..."
															className="h-11"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</TabsContent>

									<TabsContent value="national" className="mt-4 space-y-4">
										<FormField
											control={form.control}
											name="clubName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<FlagIcon className="size-4 text-muted-foreground" />
														National Team
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Argentina, Brazil, USA..."
															className="h-11"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="nationalTeamLevel"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="flex items-center gap-2">
														<UserIcon className="size-4 text-muted-foreground" />
														Category / Level
													</FormLabel>
													<FormControl>
														<Input
															placeholder="U17, U20, Senior, Olympic..."
															className="h-11"
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Age category or team level
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									</TabsContent>
								</Tabs>

								<Separator className="my-4" />

								{/* Period */}
								<div className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<CalendarIcon className="size-4 text-muted-foreground" />
										Period
									</h3>
									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="startDate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel className="text-muted-foreground text-xs">
														Start Date
													</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className={cn(
																		"h-11 w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground",
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
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																disabled={(date) =>
																	date > new Date() ||
																	date < new Date("1950-01-01")
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
													<FormLabel className="text-muted-foreground text-xs">
														End Date
													</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className={cn(
																		"h-11 w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground",
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
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																disabled={(date) =>
																	date > new Date() ||
																	date < new Date("1950-01-01")
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
								</div>

								<Separator className="my-4" />

								{/* Details */}
								<div className="space-y-4">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<MapPinIcon className="size-4 text-muted-foreground" />
										Details
									</h3>

									<FormField
										control={form.control}
										name="position"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-muted-foreground text-xs">
													Position / Role
												</FormLabel>
												<FormControl>
													<Input
														placeholder="Midfielder, Forward, Point Guard..."
														className="h-11"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="achievements"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="flex items-center gap-2 text-muted-foreground text-xs">
													<TrophyIcon className="size-3.5" />
													Achievements
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="League champion 2024, Top scorer, MVP, Best defender..."
														className="resize-none min-h-[80px]"
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
												<FormLabel className="text-muted-foreground text-xs">
													Additional Notes
												</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Any additional information..."
														className="resize-none min-h-[60px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Footer */}
							<SheetFooter className="px-6 py-4 border-t bg-muted/30">
								<div className="flex gap-3 w-full">
									<Button
										type="button"
										variant="outline"
										className="flex-1"
										onClick={() => modal.hide()}
										disabled={createMutation.isPending}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										className="flex-1"
										disabled={createMutation.isPending}
									>
										{createMutation.isPending && (
											<Loader2Icon className="mr-2 size-4 animate-spin" />
										)}
										{wasNationalTeam ? "Add Selection" : "Add Club"}
									</Button>
								</div>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	});
