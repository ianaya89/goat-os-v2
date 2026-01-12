"use client";

import NiceModal, { type NiceModalHocProps } from "@ebay/nice-modal-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { WaitlistPriority, WaitlistReferenceType } from "@/lib/db/schema/enums";
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
		trainingSessionId: string | null;
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

		// Get all athletes for selection
		const { data: athletesData } = trpc.organization.athlete.list.useQuery(
			{
				limit: 500,
				offset: 0,
				filters: { status: ["active"] },
			},
			{
				staleTime: 30000,
			},
		);

		// Get training sessions for selection
		const { data: sessionsData } =
			trpc.organization.trainingSession.list.useQuery(
				{
					limit: 500,
					offset: 0,
					filters: { status: ["pending", "confirmed"] },
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
		const sessions = sessionsData?.sessions ?? [];
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
						reason: entry.reason ?? "",
						notes: entry.notes ?? "",
					}
				: {
						athleteId: "",
						referenceType: WaitlistReferenceType.trainingSession,
						trainingSessionId: undefined,
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
																		value ===
																		WaitlistReferenceType.trainingSession
																	) {
																		form.setValue("athleteGroupId", undefined);
																	} else {
																		form.setValue(
																			"trainingSessionId",
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
																		value={
																			WaitlistReferenceType.trainingSession
																		}
																	>
																		Sesion de Entrenamiento
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

											{/* Reference Selection */}
											{referenceType ===
												WaitlistReferenceType.trainingSession && (
												<FormField
													control={form.control}
													name="trainingSessionId"
													render={({ field }) => (
														<FormItem asChild>
															<Field>
																<FormLabel>Sesion</FormLabel>
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
																				? (sessions.find(
																						(s) => s.id === field.value,
																					)?.title ?? "Seleccionar sesion...")
																				: "Seleccionar sesion..."}
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent
																		className="w-[300px] p-0"
																		align="start"
																	>
																		<Command>
																			<CommandInput placeholder="Buscar sesion..." />
																			<CommandList>
																				<CommandEmpty>
																					No se encontraron sesiones.
																				</CommandEmpty>
																				<CommandGroup>
																					{sessions.map((session) => (
																						<CommandItem
																							key={session.id}
																							value={session.title}
																							onSelect={() => {
																								field.onChange(session.id);
																								setReferencePopoverOpen(false);
																							}}
																						>
																							<span className="truncate">
																								{session.title}
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
