"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Check, Loader2, Search, UserPlus, Users } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import { useDebounce } from "@/hooks/use-debounce";
import { EventRegistrationStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface RegisterExistingAthletesModalProps {
	eventId: string;
}

export const RegisterExistingAthletesModal = NiceModal.create(
	({ eventId }: RegisterExistingAthletesModalProps) => {
		const modal = useModal();
		const [searchQuery, setSearchQuery] = React.useState("");
		const [selectedAthleteIds, setSelectedAthleteIds] = React.useState<
			Set<string>
		>(new Set());

		const utils = trpc.useUtils();

		// Debounce search query
		const debouncedSearch = useDebounce(searchQuery, 300);
		const shouldSearch = debouncedSearch.length >= 2;

		// Search athletes on demand
		const {
			data: athletesData,
			isPending: athletesPending,
			error: athletesError,
		} = trpc.organization.athlete.list.useQuery(
			{
				limit: 50,
				query: debouncedSearch,
			},
			{
				enabled: shouldSearch,
			},
		);

		// Get existing registrations for this event (only IDs needed)
		const { data: registrationsData } =
			trpc.organization.sportsEvent.listRegistrations.useQuery({
				eventId,
				limit: 100,
			});

		const registerMutation =
			trpc.organization.sportsEvent.registerExistingAthletes.useMutation({
				onSuccess: (result) => {
					toast.success(
						`${result.registered} atleta${result.registered !== 1 ? "s" : ""} registrado${result.registered !== 1 ? "s" : ""}`,
					);
					utils.organization.sportsEvent.listRegistrations.invalidate({
						eventId,
					});
					utils.organization.sportsEvent.get.invalidate({ id: eventId });
					modal.hide();
				},
				onError: (error) => {
					toast.error(error.message || "Error al registrar atletas");
				},
			});

		// Filter athletes that are already registered
		const registeredAthleteIds = React.useMemo(() => {
			if (!registrationsData?.registrations) return new Set<string>();
			return new Set(
				registrationsData.registrations
					.filter((r) => r.athleteId)
					.map((r) => r.athleteId as string),
			);
		}, [registrationsData]);

		// Filter out already registered athletes from search results
		const filteredAthletes = React.useMemo(() => {
			if (!shouldSearch || !athletesData?.athletes) return [];

			return athletesData.athletes.filter(
				(athlete) => !registeredAthleteIds.has(athlete.id),
			);
		}, [athletesData, registeredAthleteIds, shouldSearch]);

		const hasError = !!athletesError;
		const isSearching = shouldSearch && athletesPending;

		const handleToggleAthlete = (athleteId: string) => {
			setSelectedAthleteIds((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(athleteId)) {
					newSet.delete(athleteId);
				} else {
					newSet.add(athleteId);
				}
				return newSet;
			});
		};

		const _handleSelectAll = () => {
			if (filteredAthletes.length === 0) return;
			if (selectedAthleteIds.size === filteredAthletes.length) {
				setSelectedAthleteIds(new Set());
			} else {
				setSelectedAthleteIds(new Set(filteredAthletes.map((a) => a.id)));
			}
		};

		const handleClearSelection = () => {
			setSelectedAthleteIds(new Set());
		};

		const handleSubmit = () => {
			if (selectedAthleteIds.size === 0) {
				toast.error("Selecciona al menos un atleta");
				return;
			}

			registerMutation.mutate({
				eventId,
				athleteIds: Array.from(selectedAthleteIds),
				status: EventRegistrationStatus.confirmed,
			});
		};

		return (
			<Dialog open={modal.visible} onOpenChange={(v) => !v && modal.hide()}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<UserPlus className="size-5" />
							Inscribir Atletas Existentes
						</DialogTitle>
						<DialogDescription>
							Selecciona atletas de tu organizacion para inscribirlos al evento
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Buscar por nombre o email..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Selection info */}
						<div className="flex items-center justify-between text-sm">
							{selectedAthleteIds.size > 0 ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleClearSelection}
								>
									Limpiar seleccion
								</Button>
							) : (
								<span className="text-muted-foreground text-xs">
									Escribe al menos 2 caracteres para buscar
								</span>
							)}
							{selectedAthleteIds.size > 0 && (
								<span className="text-muted-foreground">
									{selectedAthleteIds.size} seleccionado
									{selectedAthleteIds.size !== 1 ? "s" : ""}
								</span>
							)}
						</div>

						{/* Athletes list */}
						<ScrollArea className="h-[400px] rounded-md border">
							{!shouldSearch ? (
								<div className="flex flex-col items-center justify-center p-8 text-center">
									<Search className="size-12 text-muted-foreground mb-4" />
									<p className="font-medium">Buscar atletas</p>
									<p className="text-sm text-muted-foreground">
										Escribe el nombre o email del atleta para buscarlo
									</p>
								</div>
							) : isSearching ? (
								<div className="space-y-2 p-4">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={i} className="h-14 w-full" />
									))}
								</div>
							) : hasError ? (
								<div className="flex flex-col items-center justify-center p-8 text-center">
									<Users className="size-12 text-destructive mb-4" />
									<p className="font-medium text-destructive">
										Error al cargar datos
									</p>
									<p className="text-sm text-muted-foreground">
										{athletesError?.message || "Error desconocido"}
									</p>
								</div>
							) : filteredAthletes.length === 0 ? (
								<div className="flex flex-col items-center justify-center p-8 text-center">
									<Users className="size-12 text-muted-foreground mb-4" />
									<p className="font-medium">No se encontraron atletas</p>
									<p className="text-sm text-muted-foreground">
										Prueba con otro termino de busqueda
									</p>
								</div>
							) : (
								<div className="p-2">
									{filteredAthletes.map((athlete) => (
										<div
											key={athlete.id}
											role="button"
											tabIndex={0}
											className={cn(
												"flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors mb-2",
												selectedAthleteIds.has(athlete.id)
													? "border-primary bg-primary/5"
													: "hover:bg-muted/50",
											)}
											onClick={() => handleToggleAthlete(athlete.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													handleToggleAthlete(athlete.id);
												}
											}}
										>
											<Checkbox
												checked={selectedAthleteIds.has(athlete.id)}
												onCheckedChange={() => handleToggleAthlete(athlete.id)}
											/>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">
													{athlete.user?.name || "Sin nombre"}
												</p>
												<p className="text-sm text-muted-foreground truncate">
													{athlete.user?.email || "Sin email"}
												</p>
											</div>
											<div className="flex flex-wrap gap-1">
												{athlete.category && (
													<Badge variant="secondary" className="text-xs">
														{athlete.category}
													</Badge>
												)}
												{athlete.position && (
													<Badge variant="outline" className="text-xs">
														{athlete.position}
													</Badge>
												)}
											</div>
											{selectedAthleteIds.has(athlete.id) && (
												<Check className="size-4 text-primary shrink-0" />
											)}
										</div>
									))}
								</div>
							)}
						</ScrollArea>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => modal.hide()}>
							Cancelar
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={
								selectedAthleteIds.size === 0 || registerMutation.isPending
							}
						>
							{registerMutation.isPending && (
								<Loader2 className="mr-2 size-4 animate-spin" />
							)}
							Inscribir{" "}
							{selectedAthleteIds.size > 0 && `(${selectedAthleteIds.size})`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
