"use client";

import { Check, Loader2, User, UserPlus, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

interface StaffMember {
	id: string;
	staffType: string;
	userId: string | null;
	externalName: string | null;
	role: string;
	roleTitle: string | null;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	} | null;
}

interface StaffAssignmentModalProps {
	eventId: string;
	entityId: string; // stationId or zoneId
	entityType: "station" | "zone";
	entityName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentStaffIds: string[];
	onAssignmentChange?: () => void;
}

export function StaffAssignmentModal({
	eventId,
	entityId,
	entityType,
	entityName,
	open,
	onOpenChange,
	currentStaffIds,
	onAssignmentChange,
}: StaffAssignmentModalProps) {
	const [search, setSearch] = React.useState("");
	const [selectedStaff, setSelectedStaff] = React.useState<Set<string>>(
		new Set(currentStaffIds),
	);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const utils = trpc.useUtils();

	// Get all staff for the event
	const { data: allStaff, isPending: isLoadingStaff } =
		trpc.organization.eventOrganization.listStaff.useQuery(
			{ eventId },
			{ enabled: open },
		);

	// Station mutations
	const assignToStation =
		trpc.organization.eventRotation.assignStaffToStation.useMutation();
	const removeFromStation =
		trpc.organization.eventRotation.removeStaffFromStation.useMutation();

	// Zone mutations (if available)
	const assignToZone =
		trpc.organization.eventOrganization.assignStaffToZone.useMutation();
	const removeFromZone =
		trpc.organization.eventOrganization.removeStaffFromZone.useMutation();

	// Reset selected staff when modal opens
	React.useEffect(() => {
		if (open) {
			setSelectedStaff(new Set(currentStaffIds));
		}
	}, [open, currentStaffIds]);

	const filteredStaff = React.useMemo(() => {
		if (!allStaff) return [];
		const lowerSearch = search.toLowerCase();
		return allStaff.filter((staff) => {
			const name =
				staff.staffType === "system_user"
					? staff.user?.name || staff.user?.email
					: staff.externalName;
			return (
				!search ||
				name?.toLowerCase().includes(lowerSearch) ||
				staff.roleTitle?.toLowerCase().includes(lowerSearch)
			);
		});
	}, [allStaff, search]);

	const toggleStaff = (staffId: string) => {
		const newSelected = new Set(selectedStaff);
		if (newSelected.has(staffId)) {
			newSelected.delete(staffId);
		} else {
			newSelected.add(staffId);
		}
		setSelectedStaff(newSelected);
	};

	const handleSave = async () => {
		setIsSubmitting(true);
		try {
			const toAdd = [...selectedStaff].filter(
				(id) => !currentStaffIds.includes(id),
			);
			const toRemove = currentStaffIds.filter((id) => !selectedStaff.has(id));

			if (entityType === "station") {
				// Add new staff
				for (const staffId of toAdd) {
					await assignToStation.mutateAsync({
						stationId: entityId,
						staffId,
					});
				}
				// Remove staff
				for (const staffId of toRemove) {
					await removeFromStation.mutateAsync({
						stationId: entityId,
						staffId,
					});
				}
				utils.organization.eventRotation.listStations.invalidate({ eventId });
				utils.organization.eventRotation.getOverview.invalidate({ eventId });
			} else {
				// Zone assignments
				for (const staffId of toAdd) {
					await assignToZone.mutateAsync({
						zoneId: entityId,
						staffId,
					});
				}
				for (const staffId of toRemove) {
					await removeFromZone.mutateAsync({
						zoneId: entityId,
						staffId,
					});
				}
				utils.organization.eventOrganization.listZones.invalidate({ eventId });
			}

			toast.success("Staff actualizado");
			onAssignmentChange?.();
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error al actualizar staff",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStaffName = (staff: StaffMember) => {
		if (staff.staffType === "system_user") {
			return staff.user?.name || staff.user?.email || "Usuario";
		}
		return staff.externalName || "Externo";
	};

	const getStaffInitials = (staff: StaffMember) => {
		const name = getStaffName(staff);
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserPlus className="size-5" />
						Asignar Staff
					</DialogTitle>
					<DialogDescription>
						Selecciona el staff para "{entityName}"
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						placeholder="Buscar staff..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{isLoadingStaff ? (
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : filteredStaff.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<User className="mx-auto mb-2 size-8" />
							<p className="text-sm">
								{allStaff?.length === 0
									? "No hay staff registrado para este evento"
									: "No se encontraron resultados"}
							</p>
						</div>
					) : (
						<ScrollArea className="h-[300px] pr-4">
							<div className="space-y-2">
								{filteredStaff.map((staff) => {
									const isSelected = selectedStaff.has(staff.id);
									return (
										<div
											key={staff.id}
											role="button"
											tabIndex={0}
											className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
												isSelected
													? "border-primary bg-primary/5"
													: "hover:bg-muted/50"
											}`}
											onClick={() => toggleStaff(staff.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleStaff(staff.id);
												}
											}}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => toggleStaff(staff.id)}
											/>
											<Avatar className="size-8">
												<AvatarImage
													src={staff.user?.image || undefined}
													alt={getStaffName(staff)}
												/>
												<AvatarFallback className="text-xs">
													{getStaffInitials(staff)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{getStaffName(staff)}
												</p>
												<p className="text-xs text-muted-foreground truncate">
													{staff.roleTitle || staff.role}
												</p>
											</div>
											{staff.staffType === "external" && (
												<Badge variant="secondary" className="text-xs">
													Externo
												</Badge>
											)}
										</div>
									);
								})}
							</div>
						</ScrollArea>
					)}

					{selectedStaff.size > 0 && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Check className="size-4 text-primary" />
							{selectedStaff.size} staff seleccionado
							{selectedStaff.size !== 1 ? "s" : ""}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancelar
					</Button>
					<Button onClick={handleSave} disabled={isSubmitting}>
						{isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
