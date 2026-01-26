"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	ChevronLeftIcon,
	Loader2Icon,
	MapPinIcon,
	SendIcon,
	UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type AgeCategory,
	type FullRegistrationWizardInput,
	type PriceInfo,
	type ReviewStepInput,
	reviewStepSchema,
} from "@/schemas/public-event-registration-wizard-schemas";

interface EventData {
	id: string;
	title: string;
	startDate: Date;
	endDate: Date | null;
	location: {
		name: string;
		address: string | null;
		city: string | null;
	} | null;
}

interface ReviewStepProps {
	formData: Partial<FullRegistrationWizardInput>;
	event: EventData;
	matchedAgeCategory: AgeCategory | null;
	calculatedPrice: PriceInfo | null;
	isLoadingPrice: boolean;
	isSubmitting: boolean;
	isMinor: boolean;
	onSubmit: (data: ReviewStepInput) => void;
	onBack: () => void;
}

function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency,
	}).format(amount / 100); // Assuming amount is in cents
}

export function ReviewStep({
	formData,
	event,
	matchedAgeCategory,
	calculatedPrice,
	isLoadingPrice,
	isSubmitting,
	isMinor,
	onSubmit,
	onBack,
}: ReviewStepProps) {
	const form = useZodForm({
		schema: reviewStepSchema,
		defaultValues: {
			acceptTerms: false as unknown as true,
			confirmMedicalFitness: false as unknown as true,
			parentalConsent: false,
			notes: "",
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="text-center">
					<h2 className="text-lg font-semibold">Revisar inscripción</h2>
					<p className="text-sm text-muted-foreground">
						Verifica tus datos antes de confirmar
					</p>
				</div>

				{/* Event Info */}
				<div className="rounded-lg border bg-muted/30 p-4">
					<h3 className="font-semibold">{event.title}</h3>
					<div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-1">
							<CalendarIcon className="h-4 w-4" />
							<span>
								{format(event.startDate, "d 'de' MMMM, yyyy", { locale: es })}
							</span>
						</div>
						{event.location && (
							<div className="flex items-center gap-1">
								<MapPinIcon className="h-4 w-4" />
								<span>
									{event.location.name}
									{event.location.city && `, ${event.location.city}`}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Personal Data Summary */}
				<div className="space-y-3">
					<h4 className="flex items-center gap-2 text-sm font-medium">
						<UserIcon className="h-4 w-4" />
						Datos personales
					</h4>
					<div className="grid gap-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Nombre</span>
							<span className="font-medium">{formData.fullName}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Email</span>
							<span className="font-medium">{formData.email}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Teléfono</span>
							<span className="font-medium">{formData.phone}</span>
						</div>
						{formData.birthDate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									Fecha de nacimiento
								</span>
								<span className="font-medium">
									{format(formData.birthDate, "d/MM/yyyy")}
								</span>
							</div>
						)}
						{matchedAgeCategory && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Categoría</span>
								<Badge variant="secondary">
									{matchedAgeCategory.displayName || matchedAgeCategory.name}
								</Badge>
							</div>
						)}
					</div>
				</div>

				<Separator />

				{/* Athlete Profile Summary */}
				<div className="space-y-3">
					<h4 className="text-sm font-medium">Perfil deportivo</h4>
					<div className="grid gap-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Deporte</span>
							<span className="font-medium">{formData.sport}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Nivel</span>
							<span className="font-medium capitalize">{formData.level}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Posición</span>
							<span className="font-medium">{formData.position}</span>
						</div>
						{formData.currentClub && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Club</span>
								<span className="font-medium">{formData.currentClub}</span>
							</div>
						)}
					</div>
				</div>

				<Separator />

				{/* Emergency Contact Summary */}
				<div className="space-y-3">
					<h4 className="text-sm font-medium">Contacto de emergencia</h4>
					<div className="grid gap-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Nombre</span>
							<span className="font-medium">
								{formData.emergencyContactName}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Teléfono</span>
							<span className="font-medium">
								{formData.emergencyContactPhone}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Relación</span>
							<span className="font-medium">
								{formData.emergencyContactRelation}
							</span>
						</div>
					</div>
				</div>

				{/* Parent/Guardian Summary (for minors) */}
				{isMinor && formData.parentName && (
					<>
						<Separator />
						<div className="space-y-3">
							<h4 className="text-sm font-medium">Padre/Tutor</h4>
							<div className="grid gap-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Nombre</span>
									<span className="font-medium">{formData.parentName}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Teléfono</span>
									<span className="font-medium">{formData.parentPhone}</span>
								</div>
								{formData.parentEmail && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">Email</span>
										<span className="font-medium">{formData.parentEmail}</span>
									</div>
								)}
								{formData.parentRelationship && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">Relación</span>
										<span className="font-medium">
											{formData.parentRelationship}
										</span>
									</div>
								)}
							</div>
						</div>
					</>
				)}

				<Separator />

				{/* Price */}
				<div className="rounded-lg border bg-muted/30 p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">
								Precio de inscripción
							</p>
							{calculatedPrice && (
								<p className="text-xs text-muted-foreground">
									{calculatedPrice.tierName}
								</p>
							)}
						</div>
						{isLoadingPrice ? (
							<Skeleton className="h-8 w-24" />
						) : calculatedPrice ? (
							<p className="text-2xl font-bold">
								{formatCurrency(
									calculatedPrice.price,
									calculatedPrice.currency,
								)}
							</p>
						) : (
							<p className="text-muted-foreground">Sin precio configurado</p>
						)}
					</div>
				</div>

				{/* Notes */}
				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem asChild>
							<Field>
								<FieldLabel>
									Notas adicionales{" "}
									<span className="text-muted-foreground">(opcional)</span>
								</FieldLabel>
								<FormControl>
									<Textarea
										placeholder="Alergias, condiciones médicas, comentarios..."
										className="resize-none"
										rows={3}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</Field>
						</FormItem>
					)}
				/>

				{/* Terms */}
				<FormField
					control={form.control}
					name="acceptTerms"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-start gap-3">
								<FormControl>
									<Checkbox
										checked={field.value === true}
										onCheckedChange={(checked) =>
											field.onChange(checked === true ? true : undefined)
										}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<label
										htmlFor="terms"
										className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Acepto los términos y condiciones
									</label>
									<p className="text-xs text-muted-foreground">
										Al inscribirte, aceptas las políticas del evento y el
										tratamiento de tus datos personales.
									</p>
								</div>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Medical Fitness Confirmation */}
				<FormField
					control={form.control}
					name="confirmMedicalFitness"
					render={({ field }) => (
						<FormItem>
							<div className="flex items-start gap-3">
								<FormControl>
									<Checkbox
										checked={field.value === true}
										onCheckedChange={(checked) =>
											field.onChange(checked === true ? true : undefined)
										}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
										Confirmo aptitud física para la actividad
									</FormLabel>
									<p className="text-xs text-muted-foreground">
										Declaro que me encuentro en condiciones físicas aptas para
										participar en este evento deportivo, avalado por un
										profesional médico.
									</p>
								</div>
							</div>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Parental Consent (for minors) */}
				{isMinor && (
					<FormField
						control={form.control}
						name="parentalConsent"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-start gap-3">
									<FormControl>
										<Checkbox
											checked={field.value === true}
											onCheckedChange={(checked) =>
												field.onChange(checked === true)
											}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
											Consentimiento parental
										</FormLabel>
										<p className="text-xs text-muted-foreground">
											Como padre, madre o tutor legal, autorizo la participación
											del menor en este evento deportivo.
										</p>
									</div>
								</div>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				<div className="flex justify-between gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={onBack}
						disabled={isSubmitting}
					>
						<ChevronLeftIcon className="mr-2 h-4 w-4" />
						Anterior
					</Button>
					<Button type="submit" disabled={isSubmitting || isLoadingPrice}>
						{isSubmitting ? (
							<>
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								Procesando...
							</>
						) : (
							<>
								<SendIcon className="mr-2 h-4 w-4" />
								Confirmar inscripción
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
