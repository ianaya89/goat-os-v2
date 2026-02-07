"use client";

import NiceModal from "@ebay/nice-modal-react";
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
import { useEnhancedModal } from "@/hooks/use-enhanced-modal";
import { useZodForm } from "@/hooks/use-zod-form";
import { TeamStaffRole } from "@/lib/db/schema/enums";
import {
	addTeamStaffSchema,
	updateTeamStaffSchema,
} from "@/schemas/organization-team-schemas";
import { trpc } from "@/trpc/client";

const roleLabels: Record<string, string> = {
	head_coach: "Director técnico",
	assistant_coach: "Asistente técnico",
	fitness_coach: "Preparador físico",
	goalkeeper_coach: "Entrenador de arqueros",
	analyst: "Analista",
	medic: "Médico",
	physiotherapist: "Fisioterapeuta",
	manager: "Manager",
	kit_manager: "Utilero",
	other: "Otro",
};

interface TeamStaff {
	id: string;
	coachId: string | null;
	userId: string | null;
	role: string;
	coach?: { id: string; user: { id: string; name: string } | null } | null;
	user?: { id: string; name: string } | null;
}

interface TeamStaffModalProps {
	teamId: string;
	staff?: TeamStaff;
}

export const TeamStaffModal = NiceModal.create<TeamStaffModalProps>(
	({ teamId, staff }) => {
		const modal = useEnhancedModal();
		const isEditing = !!staff;
		const utils = trpc.useUtils();

		const { data: coaches } = trpc.organization.coach.list.useQuery({
			limit: 100,
			offset: 0,
		});

		const { data: members } = trpc.organization.user.list.useQuery({
			limit: 100,
			offset: 0,
		});

		const form = useZodForm({
			schema: isEditing ? updateTeamStaffSchema : addTeamStaffSchema,
			defaultValues: {
				id: staff?.id,
				teamId,
				coachId: staff?.coachId ?? undefined,
				userId: staff?.userId ?? undefined,
				role:
					(staff?.role as (typeof TeamStaffRole)[keyof typeof TeamStaffRole]) ??
					TeamStaffRole.assistantCoach,
			},
		});

		const addMutation = trpc.organization.team.addStaff.useMutation({
			onSuccess: () => {
				toast.success("Staff agregado al equipo");
				utils.organization.team.get.invalidate({ id: teamId });
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar staff");
			},
		});

		const updateMutation = trpc.organization.team.updateStaff.useMutation({
			onSuccess: () => {
				toast.success("Staff actualizado");
				utils.organization.team.get.invalidate({ id: teamId });
				modal.hide();
			},
			onError: (error) => {
				toast.error(error.message || "Error al actualizar staff");
			},
		});

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing && staff) {
				updateMutation.mutate({
					id: staff.id,
					role: data.role,
					title: data.title,
					isPrimary: data.isPrimary,
					notes: data.notes,
				});
			} else {
				const addData = data as {
					teamId: string;
					coachId?: string | null;
					userId?: string | null;
					role: (typeof TeamStaffRole)[keyof typeof TeamStaffRole];
					title?: string | null;
					isPrimary?: boolean;
					notes?: string | null;
				};
				addMutation.mutate({
					teamId,
					coachId: addData.coachId,
					userId: addData.userId,
					role: addData.role,
					title: addData.title,
					isPrimary: addData.isPrimary,
					notes: addData.notes,
				});
			}
		});

		const isPending = addMutation.isPending || updateMutation.isPending;
		const selectedCoachId = form.watch("coachId");

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar staff" : "Agregar staff"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Modifica los datos del miembro del staff"
								: "Agrega un entrenador o usuario al staff del equipo"}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form onSubmit={onSubmit} className="mt-6 space-y-6">
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rol</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar rol" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.entries(roleLabels).map(([value, label]) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{!isEditing && (
								<>
									<FormField
										control={form.control}
										name="coachId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Entrenador</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value ?? undefined}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Seleccionar entrenador" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{coaches?.coaches.map((coach) => (
															<SelectItem key={coach.id} value={coach.id}>
																{coach.user?.name ?? "Sin nombre"}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormDescription>
													Selecciona un entrenador o un usuario (no ambos)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									{!selectedCoachId && (
										<FormField
											control={form.control}
											name="userId"
											render={({ field }) => (
												<FormItem>
													<FormLabel>O selecciona un usuario</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value ?? undefined}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue placeholder="Seleccionar usuario" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{members?.users.map((user) => (
																<SelectItem key={user.id} value={user.id}>
																	{user.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</>
							)}

							<SheetFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => modal.hide()}
									disabled={isPending}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={isPending}>
									{isPending
										? "Guardando..."
										: isEditing
											? "Guardar cambios"
											: "Agregar staff"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
