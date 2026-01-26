"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/custom/date-picker";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import {
	type AgeCategory,
	type PersonalInfoStepInput,
	personalInfoStepSchema,
} from "@/schemas/public-event-registration-wizard-schemas";

interface PersonalInfoStepProps {
	defaultValues: {
		fullName: string;
		birthDate?: Date;
		phone: string;
		nationality?: string;
		residenceCity?: string;
		residenceCountry?: string;
		dietaryRestrictions?: string;
		allergies?: string;
	};
	matchedAgeCategory: AgeCategory | null;
	onBirthDateChange: (date: Date) => AgeCategory | null;
	onSubmit: (data: PersonalInfoStepInput) => void;
	onBack: () => void;
}

export function PersonalInfoStep({
	defaultValues,
	matchedAgeCategory,
	onBirthDateChange,
	onSubmit,
	onBack,
}: PersonalInfoStepProps) {
	const form = useZodForm({
		schema: personalInfoStepSchema,
		defaultValues,
	});

	const handleBirthDateChange = (date: Date | undefined) => {
		if (date) {
			onBirthDateChange(date);
		}
	};

	const handleFormSubmit = (data: unknown) => {
		const typedData = data as PersonalInfoStepInput;
		onSubmit(typedData);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className="space-y-6"
			>
				<div className="space-y-4">
					<div className="text-center">
						<h2 className="text-lg font-semibold">Información personal</h2>
						<p className="text-sm text-muted-foreground">
							Completa tus datos personales
						</p>
					</div>

					<FormField
						control={form.control}
						name="fullName"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>Nombre completo</FieldLabel>
									<FormControl>
										<Input
											placeholder="Juan Pérez"
											autoComplete="name"
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
						name="birthDate"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<div className="flex items-center justify-between">
										<FieldLabel>Fecha de nacimiento</FieldLabel>
										{matchedAgeCategory && (
											<Badge variant="secondary" className="ml-2">
												{matchedAgeCategory.displayName ||
													matchedAgeCategory.name}
											</Badge>
										)}
									</div>
									<FormControl>
										<DatePicker
											date={field.value as Date | undefined}
											onDateChange={(date) => {
												field.onChange(date);
												handleBirthDateChange(date);
											}}
											placeholder="Seleccionar fecha"
										/>
									</FormControl>
									{matchedAgeCategory ? (
										<FieldDescription>
											Categoría detectada automáticamente
										</FieldDescription>
									) : field.value ? (
										<FieldDescription className="text-amber-600">
											No hay categoría disponible para tu edad
										</FieldDescription>
									) : null}
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>Teléfono</FieldLabel>
									<FormControl>
										<Input
											type="tel"
											placeholder="+54 9 11 1234-5678"
											autoComplete="tel"
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
						name="nationality"
						render={({ field }) => (
							<FormItem asChild>
								<Field>
									<FieldLabel>
										Nacionalidad{" "}
										<span className="text-muted-foreground">(opcional)</span>
									</FieldLabel>
									<FormControl>
										<Input
											placeholder="Argentina"
											autoComplete="country-name"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</Field>
							</FormItem>
						)}
					/>

					{/* Residence */}
					<div className="grid grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="residenceCity"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>
											Ciudad{" "}
											<span className="text-muted-foreground">(opcional)</span>
										</FieldLabel>
										<FormControl>
											<Input placeholder="Buenos Aires" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="residenceCountry"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FieldLabel>
											País{" "}
											<span className="text-muted-foreground">(opcional)</span>
										</FieldLabel>
										<FormControl>
											<Input placeholder="Argentina" {...field} />
										</FormControl>
										<FormMessage />
									</Field>
								</FormItem>
							)}
						/>
					</div>

					{/* Health Information */}
					<fieldset className="rounded-lg border p-4 mt-4">
						<legend className="px-2 text-sm font-medium text-muted-foreground">
							Información de Salud (opcional)
						</legend>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="dietaryRestrictions"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Restricciones Alimenticias</FieldLabel>
											<FormControl>
												<Textarea
													placeholder="Ej: Vegetariano, vegano, sin gluten, sin lactosa..."
													className="min-h-[80px]"
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
								name="allergies"
								render={({ field }) => (
									<FormItem asChild>
										<Field>
											<FieldLabel>Alergias</FieldLabel>
											<FormControl>
												<Textarea
													placeholder="Ej: Maní, mariscos, penicilina..."
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FieldDescription>
												Incluye alergias alimentarias y medicamentosas
											</FieldDescription>
											<FormMessage />
										</Field>
									</FormItem>
								)}
							/>
						</div>
					</fieldset>
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
