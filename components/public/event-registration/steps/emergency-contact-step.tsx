"use client";

import { ChevronLeftIcon, ChevronRightIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type EmergencyContactStepInput,
	emergencyContactStepSchema,
} from "@/schemas/public-event-registration-wizard-schemas";

interface EmergencyContactStepProps {
	defaultValues: {
		emergencyContactName: string;
		emergencyContactPhone: string;
		emergencyContactRelation: string;
		parentName?: string;
		parentPhone?: string;
		parentEmail?: string;
		parentRelationship?: string;
	};
	onSubmit: (data: EmergencyContactStepInput) => void;
	onBack: () => void;
	isMinor: boolean;
}

export function EmergencyContactStep({
	defaultValues,
	onSubmit,
	onBack,
	isMinor,
}: EmergencyContactStepProps) {
	const form = useZodForm({
		schema: emergencyContactStepSchema,
		defaultValues: {
			emergencyContactName: defaultValues.emergencyContactName,
			emergencyContactPhone: defaultValues.emergencyContactPhone,
			emergencyContactRelation: defaultValues.emergencyContactRelation,
			parentName: defaultValues.parentName ?? "",
			parentPhone: defaultValues.parentPhone ?? "",
			parentEmail: defaultValues.parentEmail ?? "",
			parentRelationship: defaultValues.parentRelationship ?? "",
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<div className="space-y-4">
					{/* Parent/Guardian section for minors */}
					{isMinor && (
						<>
							<div className="text-center">
								<div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-2">
									<UsersIcon className="h-4 w-4" />
									Menor de edad
								</div>
								<h2 className="text-lg font-semibold">Datos del padre/tutor</h2>
								<p className="text-sm text-muted-foreground">
									Requerido para atletas menores de 18 años
								</p>
							</div>

							<FormField
								control={form.control}
								name="parentName"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Nombre del padre/madre/tutor *</FieldLabel>
											<FormControl>
												<Input
													placeholder="Nombre completo"
													autoComplete="off"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="parentPhone"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Teléfono del padre/tutor *</FieldLabel>
											<FormControl>
												<Input
													type="tel"
													placeholder="+54 9 11 1234-5678"
													autoComplete="off"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="parentEmail"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Email del padre/tutor (opcional)</FieldLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="email@ejemplo.com"
													autoComplete="off"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="parentRelationship"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Relación (opcional)</FieldLabel>
											<FormControl>
												<Input
													placeholder="Madre, Padre, Tutor legal"
													autoComplete="off"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>

							<div className="border-t my-6" />
						</>
					)}

					{/* Emergency contact section */}
					<div className="text-center">
						<h2 className="text-lg font-semibold">Contacto de emergencia</h2>
						<p className="text-sm text-muted-foreground">
							Persona a contactar en caso de emergencia
						</p>
					</div>

					<FormField
						control={form.control}
						name="emergencyContactName"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>Nombre del contacto</FieldLabel>
									<FormControl>
										<Input
											placeholder="María García"
											autoComplete="off"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="emergencyContactPhone"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>Teléfono del contacto</FieldLabel>
									<FormControl>
										<Input
											type="tel"
											placeholder="+54 9 11 1234-5678"
											autoComplete="off"
											{...field}
										/>
									</FormControl>
									<FieldDescription>
										Asegúrate de que sea un número accesible
									</FieldDescription>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="emergencyContactRelation"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>Relación con el contacto</FieldLabel>
									<FormControl>
										<Input
											placeholder="Madre, Padre, Tutor, etc."
											autoComplete="off"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-between gap-3">
					<Button type="button" variant="outline" onClick={onBack}>
						<ChevronLeftIcon className="mr-2 h-4 w-4" />
						Anterior
					</Button>
					<Button type="submit">
						Continuar
						<ChevronRightIcon className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	);
}
