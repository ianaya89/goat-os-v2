"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2Icon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	formatEventPrice,
	getRegistrationStatusColor,
	getRegistrationStatusLabel,
} from "@/lib/format-event";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface RegistrationDetailSheetProps {
	registrationId: string;
}

function DetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex justify-between items-start py-2">
			<span className="text-sm text-muted-foreground">{label}</span>
			<span className="text-sm font-medium text-right max-w-[60%]">
				{children}
			</span>
		</div>
	);
}

function DetailSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
			<div className="divide-y divide-border rounded-lg border bg-card px-4">
				{children}
			</div>
		</div>
	);
}

export const RegistrationDetailSheet = NiceModal.create(
	({ registrationId }: RegistrationDetailSheetProps) => {
		const modal = useModal();
		const router = useRouter();

		const { data: registration, isPending } =
			trpc.organization.sportsEvent.getRegistration.useQuery(
				{ id: registrationId },
				{ enabled: modal.visible },
			);

		return (
			<Sheet
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) modal.hide();
				}}
			>
				<SheetContent className="overflow-y-auto sm:max-w-md">
					<SheetHeader>
						<SheetTitle>Detalle de inscripción</SheetTitle>
					</SheetHeader>

					{isPending ? (
						<div className="flex items-center justify-center py-12">
							<Loader2Icon className="size-6 animate-spin text-muted-foreground" />
						</div>
					) : registration ? (
						<div className="space-y-6 pb-6">
							{/* Header */}
							<div className="flex items-center justify-between">
								<div>
									<p className="text-lg font-semibold">
										{registration.registrantName}
									</p>
									<p className="text-sm text-muted-foreground">
										{registration.registrantEmail}
									</p>
								</div>
								<Badge
									className={cn(
										"border-none px-2 py-0.5 font-medium text-xs shadow-none",
										getRegistrationStatusColor(registration.status),
									)}
									variant="outline"
								>
									{getRegistrationStatusLabel(registration.status)}
								</Badge>
							</div>

							{/* Inscripción */}
							<DetailSection title="Inscripción">
								<DetailRow label="Número">
									#{registration.registrationNumber}
								</DetailRow>
								<DetailRow label="Fuente">
									{registration.registrationSource ?? "-"}
								</DetailRow>
								<DetailRow label="Fecha">
									{format(registration.registeredAt, "dd MMM yyyy HH:mm", {
										locale: es,
									})}
								</DetailRow>
								{registration.ageCategory && (
									<DetailRow label="Categoría">
										{registration.ageCategory.displayName}
									</DetailRow>
								)}
								{registration.waitlistPosition && (
									<DetailRow label="Posición lista de espera">
										#{registration.waitlistPosition}
									</DetailRow>
								)}
							</DetailSection>

							{/* Datos personales */}
							<DetailSection title="Datos personales">
								<DetailRow label="Nombre">
									{registration.registrantName}
								</DetailRow>
								<DetailRow label="Email">
									{registration.registrantEmail}
								</DetailRow>
								{registration.registrantPhone && (
									<DetailRow label="Teléfono">
										{registration.registrantPhone}
									</DetailRow>
								)}
								{registration.registrantBirthDate && (
									<DetailRow label="Fecha de nacimiento">
										{format(registration.registrantBirthDate, "dd/MM/yyyy")}
									</DetailRow>
								)}
							</DetailSection>

							{/* Contacto de emergencia */}
							{registration.emergencyContactName && (
								<DetailSection title="Contacto de emergencia">
									<DetailRow label="Nombre">
										{registration.emergencyContactName}
									</DetailRow>
									{registration.emergencyContactPhone && (
										<DetailRow label="Teléfono">
											{registration.emergencyContactPhone}
										</DetailRow>
									)}
									{registration.emergencyContactRelation && (
										<DetailRow label="Relación">
											{registration.emergencyContactRelation}
										</DetailRow>
									)}
								</DetailSection>
							)}

							{/* Pago */}
							<DetailSection title="Pago">
								<DetailRow label="Precio">
									{formatEventPrice(registration.price, registration.currency)}
								</DetailRow>
								{registration.discountAmount > 0 && (
									<DetailRow label="Descuento">
										<span className="text-emerald-600">
											-
											{formatEventPrice(
												registration.discountAmount,
												registration.currency,
											)}
										</span>
									</DetailRow>
								)}
								<DetailRow label="Pagado">
									{formatEventPrice(
										registration.paidAmount,
										registration.currency,
									)}
								</DetailRow>
								{registration.appliedPricingTier && (
									<DetailRow label="Tier">
										{registration.appliedPricingTier.name}
									</DetailRow>
								)}
							</DetailSection>

							{/* Notas */}
							{(registration.notes || registration.internalNotes) && (
								<DetailSection title="Notas">
									{registration.notes && (
										<DetailRow label="Notas">{registration.notes}</DetailRow>
									)}
									{registration.internalNotes && (
										<DetailRow label="Notas internas">
											{registration.internalNotes}
										</DetailRow>
									)}
								</DetailSection>
							)}

							{/* Ver atleta */}
							{registration.athleteId && (
								<Button
									variant="outline"
									className="w-full"
									onClick={() => {
										modal.hide();
										router.push(
											`/dashboard/organization/athletes/${registration.athleteId}`,
										);
									}}
								>
									<UserIcon className="mr-2 size-4" />
									Ver perfil del atleta
								</Button>
							)}
						</div>
					) : (
						<p className="text-muted-foreground text-center py-12">
							No se encontró la inscripción
						</p>
					)}
				</SheetContent>
			</Sheet>
		);
	},
);
