"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { UserAvatar } from "@/components/user/user-avatar";
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	DayOfWeek,
	WaitlistPriority,
	WaitlistReferenceType,
} from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import {
	createWaitlistEntrySchema,
	updateWaitlistEntrySchema,
} from "@/schemas/organization-waitlist-schemas";
import { trpc } from "@/trpc/client";

export type WaitlistModalProps = NiceModalHocProps & {
	entry?: {
		id: string;
		athleteId: string;
		referenceType: WaitlistReferenceType;
		preferredDays: DayOfWeek[] | null;
		preferredStartTime: string | null;
		preferredEndTime: string | null;
		athleteGroupId: string | null;
		priority: WaitlistPriority;
		reason: string | null;
		notes: string | null;
		expiresAt: Date | null;
		athlete: {
			id: string;
			user: {
				id: string;
				name: string;
				email: string;
				image: string | null;
			} | null;
		};
	};
};

const priorityLabels: Record<WaitlistPriority, string> = {
	[WaitlistPriority.high]: "Alta",
	[WaitlistPriority.medium]: "Media",
	[WaitlistPriority.low]: "Baja",
};

const dayLabels: Record<DayOfWeek, string> = {
	[DayOfWeek.monday]: "Lunes",
	[DayOfWeek.tuesday]: "Martes",
	[DayOfWeek.wednesday]: "Miercoles",
	[DayOfWeek.thursday]: "Jueves",
	[DayOfWeek.friday]: "Viernes",
	[DayOfWeek.saturday]: "Sabado",
	[DayOfWeek.sunday]: "Domingo",
};

const daysOrder: DayOfWeek[] = [
	DayOfWeek.monday,
	DayOfWeek.tuesday,
	DayOfWeek.wednesday,
	DayOfWeek.thursday,
	DayOfWeek.friday,
	DayOfWeek.saturday,
	DayOfWeek.sunday,
];

export const WaitlistModal = NiceModal.create<WaitlistModalProps>(
	({ entry }) => {
		const modal = useEnhancedModal();
		const utils = trpc.useUtils();
		const isEditing = !!entry;
		const [selectedAthleteId, setSelectedAthleteId] = React.useState<
			string | null
		>(entry?.athleteId ?? null);
		const [athletePopoverOpen, setAthletePopoverOpen] = React.useState(false);
		const [referencePopoverOpen, setReferencePopoverOpen] =
			React.useState(false);

		// Get all athletes for selection (no status filter to include all athletes)
		const { data: athletesData } = trpc.organization.athlete.list.useQuery(
			{
				limit: 100,
				offset: 0,
			},
			{
				staleTime: 30000,
			},
		);

		// Get athlete groups for selection
		const { data: groupsData } =
			trpc.organization.athleteGroup.listActive.useQuery(undefined, {
				staleTime: 30000,
			});

		const athletes = athletesData?.athletes ?? [];
		const groups = groupsData ?? [];

		const createMutation = trpc.organization.waitlist.create.useMutation({
			onSuccess: () => {
				toast.success("Entrada agregada a la lista de espera");
				utils.organization.waitlist.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar entrada");
			},
		});

		const updateMutation = trpc.organization.waitlist.update.useMutation({
			onSuccess: () => {
				toast.success("Entrada actualizada");
				utils.organization.waitlist.list.invalidate();
				modal.handleClose();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar entrada");
			},
		});

		const form = useZodForm({
			schema: isEditing ? updateWaitlistEntrySchema : createWaitlistEntrySchema,
			defaultValues: isEditing
				? {
						id: entry.id,
						priority: entry.priority,
						preferredDays: entry.preferredDays ?? undefined,
						preferredStartTime: entry.preferredStartTime ?? undefined,
						preferredEndTime: entry.preferredEndTime ?? undefined,
						reason: entry.reason ?? "",
						notes: entry.notes ?? "",
					}
				: {
						athleteId: "",
						referenceType: WaitlistReferenceType.schedule,
						preferredDays: [],
						preferredStartTime: undefined,
						preferredEndTime: undefined,
						athleteGroupId: undefined,
						priority: WaitlistPriority.medium,
						reason: "",
						notes: "",
					},
		});

		const referenceType = form.watch("referenceType");

		const onSubmit = form.handleSubmit(async (data) => {
			if (isEditing) {
				updateMutation.mutate(
					data as Parameters<typeof updateMutation.mutate>[0],
				);
			} else {
				const createData = {
					...data,
					athleteId: selectedAthleteId!,
				} as Parameters<typeof createMutation.mutate>[0];
				createMutation.mutate(createData);
			}
		});

		const isPending = createMutation.isPending || updateMutation.isPending;

		const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

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
							{isEditing ? "Editar Entrada" : "Agregar a Lista de Espera"}
						</SheetTitle>
						<SheetDescription className="sr-only">
							{isEditing
								? "Actualiza la informacion de la entrada."
								: "Agrega un atleta a la lista de espera."}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={onSubmit}
							className="flex flex-1 flex-col overflow-hidden"
						>
							<ScrollArea className="flex-1">
								<div className="space-y-4 px-6 py-4">
									{!isEditing && (
										<>
											{/* Athlete Selection */}
											<Field>
												<FormLabel>Atleta</FormLabel>
												<Popover
													open={athletePopoverOpen}
													onOpenChange={setAthletePopoverOpen}
												>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className="w-full justify-start font-normal"
														>
															{selectedAthlete ? (
																<div className="flex items-center gap-2">
																	<UserAvatar
																		className="size-6"
																		name={selectedAthlete.user?.name ?? ""}
																		src={
																			selectedAthlete.user?.image ?? undefined
																		}
																	/>
																	<span>
																		{selectedAthlete.user?.name ?? "Sin nombre"}
																	</span>
																</div>
															) : (
																"Seleccionar atleta..."
															)}
														</Button>
													</PopoverTrigger>
													<PopoverContent
														className="w-[300px] p-0"
														align="start"
													>
														<Command>
															<CommandInput placeholder="Buscar atleta..." />
															<CommandList>
																<CommandEmpty>
																	No se encontraron atletas.
																</CommandEmpty>
																<CommandGroup>
																	{athletes.map((athlete) => (
																		<CommandItem
																			key={athlete.id}
																			value={athlete.user?.name ?? athlete.id}
																			onSelect={() => {
																				setSelectedAthleteId(athlete.id);
																				setAthletePopoverOpen(false);
																			}}
																		>
																			<div className="flex items-center gap-2">
																				<div
																					className={cn(
																						"flex size-4 items-center justify-center rounded-full border",
																						selectedAthleteId === athlete.id
																							? "border-primary bg-primary"
																							: "border-muted-foreground",
																					)}
																				>
																					{selectedAthleteId === athlete.id && (
																						<div className="size-2 rounded-full bg-primary-foreground" />
																					)}
																				</div>
																				<UserAvatar
																					className="size-6"
																					name={athlete.user?.name ?? ""}
																					src={athlete.user?.image ?? undefined}
																				/>
																				<span className="truncate">
																					{athlete.user?.name ?? "Sin nombre"}
																				</span>
																			</div>
																		</CommandItem>
																	))}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
											</Field>

											{/* Reference Type */}
											<FormField
												control={form.control}
												name="referenceType"
												render={({ field }) => (
													<FormItem asChild>
														<Field>
															<FormLabel>Tipo</FormLabel>
															<Select
																value={field.value}
																onValueChange={(value) => {
																	field.onChange(value);
																	// Clear the other reference when type changes
																	if (
																		value === WaitlistReferenceType.schedule
																	) {
																		form.setValue("athleteGroupId", undefined);
																	} else {
																		form.setValue("preferredDays", undefined);
																		form.setValue(
																			"preferredStartTime",
																			undefined,
																		);
																		form.setValue(
																			"preferredEndTime",
																			undefined,
																		);
																	}
																}}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Seleccionar tipo" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem
																		value={WaitlistReferenceType.schedule}
																	>
																		Horario Preferido
																	</SelectItem>
																	<SelectItem
																		value={WaitlistReferenceType.athleteGroup}
																	>
																		Grupo de Atletas
																	</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</Field>
													</FormItem>
												)}
											/>

											{/* Schedule Selection - Days */}
											{referenceType === WaitlistReferenceType.schedule && (
												<>
													<FormField
														control={form.control}
														name="preferredDays"
														render={({ field }) => (
															<FormItem asChild>
																<Field>
																	<FormLabel>Dias Preferidos</FormLabel>
																	<div className="grid grid-cols-2 gap-2">
																		{daysOrder.map((day) => (
																			<div
																				key={day}
																				className="flex items-center space-x-2"
																			>
																				<Checkbox
																					id={`day-${day}`}
																					checked={field.value?.includes(day)}
																					onCheckedChange={(checked) => {
																						const current = field.value ?? [];
																						if (checked) {
																							field.onChange([...current, day]);
																						} else {
																							field.onChange(
																								current.filter(
																									(d) => d !== day,
																								),
																							);
																						}
																					}}
																				/>
																				<label
																					htmlFor={`day-${day}`}
																					className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
																				>
																					{dayLabels[day]}
																				</label>
																			</div>
																		))}
																	</div>
																	<FormMessage />
																</Field>
															</FormItem>
														)}
													/>

													{/* Time Range */}
													<div className="grid grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name="preferredStartTime"
															render={({ field }) => (
																<FormItem asChild>
																	<Field>
																		<FormLabel>Hora Inicio</FormLabel>
																		<FormControl>
																			<Input
																				type="time"
																				placeholder="HH:MM"
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
															name="preferredEndTime"
															render={({ field }) => (
																<FormItem asChild>
																	<Field>
																		<FormLabel>Hora Fin</FormLabel>
																		<FormControl>
																			<Input
																				type="time"
																				placeholder="HH:MM"
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
												</>
											)}

											{referenceType === WaitlistReferenceType.athleteGroup && (
												<FormField
													control={form.control}
													name="athleteGroupId"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Grupo</FormLabel>
																<Popover
																	open={referencePopoverOpen}
																	onOpenChange={setReferencePopoverOpen}
																>
																	<PopoverTrigger asChild>
																		<Button
																			variant="outline"
																			className="w-full justify-start font-normal"
																		>
																			{field.value
																				? (groups.find(
																						(g) => g.id === field.value,
																					)?.name ?? "Seleccionar grupo...")
																				: "Seleccionar grupo..."}
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-[300px] p-0"
																		align="start"
																	>
																		<Command>
																			<CommandInput placeholder="Buscar grupo..." />
																			<CommandList>
																				<CommandEmpty>
																					No se encontraron grupos.
																				</CommandEmpty>
																				<CommandGroup>
																					{groups.map((group) => (
																						<CommandItem
																							key={group.id}
																							value={group.name}
																							onSelect={() => {
																								field.onChange(group.id);
																								setReferencePopoverOpen(false);
																							}}
																						>
																							<span className="truncate">
																								{group.name}
																							</span>
																						</CommandItem>
																					))}
																				</CommandGroup>
																			</CommandList>
																		</Command>
																	</PopoverContent>
																</Popover>
																<FormMessage />
															</Field>
														</FormItem>
													)}
												/>
											)}
										</>
									)}

									{/* Priority */}
									<FormField
										control={form.control}
										name="priority"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Prioridad</FormLabel>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Seleccionar prioridad" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{Object.entries(priorityLabels).map(
																([value, label]) => (
																	<SelectItem key={value} value={value}>
																		{label}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>

									{/* Reason */}
									<FormField
										control={form.control}
										name="reason"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Motivo</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Motivo por el que esta en lista de espera..."
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

									{/* Notes */}
									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Notas</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Notas adicionales..."
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
								</div>
							</ScrollArea>

							<SheetFooter className="flex-row justify-end gap-2 border-t">
								<Button
									type="button"
									variant="outline"
									onClick={modal.handleClose}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									disabled={isPending || (!isEditing && !selectedAthleteId)}
									loading={isPending}
								>
									{isEditing ? "Actualizar" : "Agregar"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
