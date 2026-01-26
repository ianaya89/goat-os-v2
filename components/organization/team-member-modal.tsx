"use client";

import NiceModal from "@ebay/nice-modal-react";
import * as React from "react";
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
import { Label } from "@/components/ui/label";
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
import { TeamMemberRole } from "@/lib/db/schema/enums";
import { updateTeamMemberSchema } from "@/schemas/organization-team-schemas";
import { trpc } from "@/trpc/client";

const roleLabels: Record<string, string> = {
	captain: "Capitán",
	vice_captain: "Vice-capitán",
	player: "Jugador",
};

interface TeamMember {
	id: string;
	athleteId: string;
	role: string;
	jerseyNumber: number | null;
	position: string | null;
	athlete: {
		id: string;
		user: { id: string; name: string } | null;
	};
}

interface TeamMemberModalProps {
	teamId: string;
	member?: TeamMember;
}

export const TeamMemberModal = NiceModal.create<TeamMemberModalProps>(
	({ teamId, member }) => {
		const modal = useEnhancedModal();
		const isEditing = !!member;
		const utils = trpc.useUtils();

		// State for add mode (not using form schema for this)
		const [athleteId, setAthleteId] = React.useState<string>("");
		const [role, setRole] = React.useState<string>(TeamMemberRole.player);
		const [jerseyNumber, setJerseyNumber] = React.useState<string>("");
		const [position, setPosition] = React.useState<string>("");

		const { data: athletes } = trpc.organization.athlete.list.useQuery({
			limit: 500,
			offset: 0,
		});

		// Form only used for editing mode
		const form = useZodForm({
			schema: updateTeamMemberSchema,
			defaultValues: {
				id: member?.id ?? "",
				role:
					(member?.role as (typeof TeamMemberRole)[keyof typeof TeamMemberRole]) ??
					TeamMemberRole.player,
				jerseyNumber: member?.jerseyNumber ?? undefined,
				position: member?.position ?? "",
			},
		});

		const addMutation = trpc.organization.team.addMembers.useMutation({
			onSuccess: () => {
				toast.success("Jugador agregado al equipo");
				utils.organization.team.get.invalidate({ id: teamId });
				modal.hide();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al agregar jugador");
			},
		});

		const updateMutation = trpc.organization.team.updateMember.useMutation({
			onSuccess: () => {
				toast.success("Jugador actualizado");
				utils.organization.team.get.invalidate({ id: teamId });
				modal.hide();
			},
			onError: (error: { message?: string }) => {
				toast.error(error.message || "Error al actualizar jugador");
			},
		});

		const handleAddSubmit = () => {
			if (!athleteId) {
				toast.error("Selecciona un atleta");
				return;
			}
			addMutation.mutate({
				teamId,
				members: [
					{
						athleteId,
						role: role as (typeof TeamMemberRole)[keyof typeof TeamMemberRole],
						jerseyNumber: jerseyNumber
							? Number.parseInt(jerseyNumber, 10)
							: undefined,
						position: position || undefined,
					},
				],
			});
		};

		const onSubmit = form.handleSubmit((data) => {
			if (isEditing && member) {
				updateMutation.mutate({
					id: member.id,
					role: data.role,
					jerseyNumber: data.jerseyNumber,
					position: data.position,
				});
			}
		});

		const isPending = addMutation.isPending || updateMutation.isPending;

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => !open && modal.hide()}
			>
				<SheetContent className="sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{isEditing ? "Editar jugador" : "Agregar jugador"}
						</SheetTitle>
						<SheetDescription>
							{isEditing
								? "Modifica los datos del jugador en el equipo"
								: "Agrega un atleta como jugador del equipo"}
						</SheetDescription>
					</SheetHeader>

					<Form {...form}>
						<form
							onSubmit={
								isEditing
									? onSubmit
									: (e) => {
											e.preventDefault();
											handleAddSubmit();
										}
							}
							className="mt-6 space-y-6"
						>
							{!isEditing && (
								<div className="space-y-2">
									<Label>Atleta</Label>
									<Select value={athleteId} onValueChange={setAthleteId}>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar atleta" />
										</SelectTrigger>
										<SelectContent>
											{athletes?.athletes.map((athlete) => (
												<SelectItem key={athlete.id} value={athlete.id}>
													{athlete.user?.name ?? "Sin nombre"}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{isEditing ? (
								<FormField
									control={form.control}
									name="role"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Rol</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value as string | undefined}
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
							) : (
								<div className="space-y-2">
									<Label>Rol</Label>
									<Select value={role} onValueChange={setRole}>
										<SelectTrigger>
											<SelectValue placeholder="Seleccionar rol" />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(roleLabels).map(([value, label]) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{isEditing ? (
								<FormField
									control={form.control}
									name="jerseyNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Número de camiseta</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													max={99}
													placeholder="10"
													{...field}
													value={(field.value as number | undefined) ?? ""}
													onChange={(e) =>
														field.onChange(
															e.target.value
																? parseInt(e.target.value, 10)
																: undefined,
														)
													}
												/>
											</FormControl>
											<FormDescription>
												Debe ser único dentro del equipo
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							) : (
								<div className="space-y-2">
									<Label>Número de camiseta</Label>
									<Input
										type="number"
										min={1}
										max={99}
										placeholder="10"
										value={jerseyNumber}
										onChange={(e) => setJerseyNumber(e.target.value)}
									/>
									<p className="text-sm text-muted-foreground">
										Debe ser único dentro del equipo
									</p>
								</div>
							)}

							{isEditing ? (
								<FormField
									control={form.control}
									name="position"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Posición</FormLabel>
											<FormControl>
												<Input
													placeholder="Delantero, Defensa, etc."
													{...field}
													value={(field.value as string | undefined) ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							) : (
								<div className="space-y-2">
									<Label>Posición</Label>
									<Input
										placeholder="Delantero, Defensa, etc."
										value={position}
										onChange={(e) => setPosition(e.target.value)}
									/>
								</div>
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
											: "Agregar jugador"}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		);
	},
);
