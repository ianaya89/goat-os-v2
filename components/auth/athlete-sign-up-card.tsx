"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	LockIcon,
	MailIcon,
	RulerIcon,
	UserIcon,
	WeightIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PasswordFormMessage } from "@/components/auth/password-form-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { InputPassword } from "@/components/ui/custom/input-password";
import { TurnstileCaptcha } from "@/components/ui/custom/turnstile";
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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useTurnstile } from "@/hooks/use-turnstile";
import { useZodForm } from "@/hooks/use-zod-form";
import { CAPTCHA_RESPONSE_HEADER } from "@/lib/auth/constants";
import { AthleteLevel, DominantSide } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { athleteSignUpSchema } from "@/schemas/auth-schemas";

const athleteLevelLabels: Record<string, string> = {
	[AthleteLevel.beginner]: "Principiante",
	[AthleteLevel.intermediate]: "Intermedio",
	[AthleteLevel.advanced]: "Avanzado",
	[AthleteLevel.elite]: "Elite",
};

const dominantSideLabels: Record<string, string> = {
	[DominantSide.right]: "Derecho",
	[DominantSide.left]: "Izquierdo",
	[DominantSide.both]: "Ambos",
};

export function AthleteSignUpCard() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const {
		turnstileRef,
		captchaToken,
		captchaEnabled,
		resetCaptcha,
		handleSuccess,
		handleError,
		handleExpire,
	} = useTurnstile();

	const methods = useZodForm({
		schema: athleteSignUpSchema,
		defaultValues: {
			name: "",
			email: "",
			password: "",
			sport: "",
			level: AthleteLevel.beginner,
			nationality: "",
			position: "",
			secondaryPosition: "",
		},
	});

	const onSubmit = methods.handleSubmit(async (data) => {
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/auth/athlete-signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(captchaEnabled && captchaToken
						? { [CAPTCHA_RESPONSE_HEADER]: captchaToken }
						: {}),
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Error al crear la cuenta");
			}

			setSubmitSuccess(true);
		} catch (e) {
			resetCaptcha();
			methods.setError("root", {
				message: e instanceof Error ? e.message : "Error al crear la cuenta",
			});
		} finally {
			setIsSubmitting(false);
		}
	});

	return (
		<Card className="w-full max-w-2xl border-transparent px-4 py-8 dark:border-border">
			<CardHeader>
				<CardTitle className="text-base lg:text-lg">
					Registro de Atleta
				</CardTitle>
				<CardDescription>
					Completa todos los campos para crear tu cuenta de atleta.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{submitSuccess ? (
					<Alert variant="info">
						<AlertDescription>
							Te hemos enviado un enlace para verificar tu email. Por favor
							revisa tu bandeja de entrada.
						</AlertDescription>
					</Alert>
				) : (
					<Form {...methods}>
						<form
							className="flex flex-col items-stretch gap-6"
							onSubmit={onSubmit}
						>
							{/* Account Information Section */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">Información de Cuenta</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={methods.control}
										name="name"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nombre completo *</FormLabel>
													<FormControl>
														<InputGroup>
															<InputGroupAddon align="inline-start">
																<InputGroupText>
																	<UserIcon className="size-4 shrink-0" />
																</InputGroupText>
															</InputGroupAddon>
															<InputGroupInput
																autoComplete="name"
																disabled={isSubmitting}
																maxLength={64}
																type="text"
																placeholder="Juan Pérez"
																{...field}
															/>
														</InputGroup>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="email"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Email *</FormLabel>
													<FormControl>
														<InputGroup>
															<InputGroupAddon align="inline-start">
																<InputGroupText>
																	<MailIcon className="size-4 shrink-0" />
																</InputGroupText>
															</InputGroupAddon>
															<InputGroupInput
																autoComplete="email"
																disabled={isSubmitting}
																maxLength={255}
																type="email"
																placeholder="juan@email.com"
																{...field}
															/>
														</InputGroup>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={methods.control}
									name="password"
									render={({ field }) => (
										<FormItem asChild>
											<Field>
												<FormLabel>Contraseña *</FormLabel>
												<FormControl>
													<InputPassword
														autoCapitalize="off"
														autoComplete="new-password"
														disabled={isSubmitting}
														maxLength={72}
														startAdornment={
															<LockIcon className="size-4 shrink-0" />
														}
														{...field}
													/>
												</FormControl>
												<PasswordFormMessage password={methods.watch("password")} />
											</Field>
										</FormItem>
									)}
								/>
							</div>

							{/* Athlete Information Section */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">Información del Atleta</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={methods.control}
										name="sport"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Deporte *</FormLabel>
													<FormControl>
														<Input
															disabled={isSubmitting}
															maxLength={100}
															type="text"
															placeholder="Fútbol, Basketball, etc."
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="birthDate"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Fecha de nacimiento *</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	disabled={isSubmitting}
																	className={cn(
																		"w-full justify-start text-left font-normal",
																		!field.value && "text-muted-foreground",
																	)}
																>
																	<CalendarIcon className="mr-2 size-4 shrink-0" />
																	{field.value instanceof Date ? (
																		format(field.value, "PPP", { locale: es })
																	) : (
																		<span>Selecciona una fecha</span>
																	)}
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0" align="start">
															<Calendar
																mode="single"
																selected={
																	field.value instanceof Date
																		? field.value
																		: undefined
																}
																onSelect={field.onChange}
																disabled={(date) =>
																	date > new Date() ||
																	date < new Date("1940-01-01")
																}
																defaultMonth={
																	field.value instanceof Date
																		? field.value
																		: new Date(2000, 0, 1)
																}
																captionLayout="dropdown"
																fromYear={1940}
																toYear={new Date().getFullYear()}
															/>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="level"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nivel *</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
														disabled={isSubmitting}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Selecciona un nivel" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{Object.entries(athleteLevelLabels).map(
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
									<FormField
										control={methods.control}
										name="nationality"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Nacionalidad *</FormLabel>
													<FormControl>
														<Input
															disabled={isSubmitting}
															maxLength={100}
															type="text"
															placeholder="Argentina"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="position"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Posición *</FormLabel>
													<FormControl>
														<Input
															disabled={isSubmitting}
															maxLength={100}
															type="text"
															placeholder="Delantero, Base, etc."
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="secondaryPosition"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Posición secundaria</FormLabel>
													<FormControl>
														<Input
															disabled={isSubmitting}
															maxLength={100}
															type="text"
															placeholder="Opcional"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Physical Attributes Section */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">Atributos Físicos</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={methods.control}
										name="height"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Altura (cm) *</FormLabel>
													<FormControl>
														<InputGroup>
															<InputGroupAddon align="inline-start">
																<InputGroupText>
																	<RulerIcon className="size-4 shrink-0" />
																</InputGroupText>
															</InputGroupAddon>
															<InputGroupInput
																type="number"
																disabled={isSubmitting}
																min={50}
																max={300}
																placeholder="175"
																{...field}
																value={field.value ?? ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value === ""
																			? undefined
																			: Number(e.target.value),
																	)
																}
															/>
														</InputGroup>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="weight"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Peso (gramos) *</FormLabel>
													<FormControl>
														<InputGroup>
															<InputGroupAddon align="inline-start">
																<InputGroupText>
																	<WeightIcon className="size-4 shrink-0" />
																</InputGroupText>
															</InputGroupAddon>
															<InputGroupInput
																type="number"
																disabled={isSubmitting}
																min={10000}
																max={300000}
																placeholder="72500 (72.5 kg)"
																{...field}
																value={field.value ?? ""}
																onChange={(e) =>
																	field.onChange(
																		e.target.value === ""
																			? undefined
																			: Number(e.target.value),
																	)
																}
															/>
														</InputGroup>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="dominantFoot"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Pie dominante *</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={isSubmitting}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Selecciona" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{Object.entries(dominantSideLabels).map(
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
									<FormField
										control={methods.control}
										name="dominantHand"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Mano dominante *</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value}
														disabled={isSubmitting}
													>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Selecciona" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{Object.entries(dominantSideLabels).map(
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
								</div>
							</div>

							{/* Optional Information Section */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">Información Adicional (Opcional)</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={methods.control}
										name="jerseyNumber"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Número de camiseta</FormLabel>
													<FormControl>
														<Input
															type="number"
															disabled={isSubmitting}
															min={0}
															max={999}
															placeholder="10"
															{...field}
															value={field.value ?? ""}
															onChange={(e) =>
																field.onChange(
																	e.target.value === ""
																		? undefined
																		: Number(e.target.value),
																)
															}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
									<FormField
										control={methods.control}
										name="yearsOfExperience"
										render={({ field }) => (
											<FormItem asChild>
												<Field>
													<FormLabel>Años de experiencia</FormLabel>
													<FormControl>
														<Input
															type="number"
															disabled={isSubmitting}
															min={0}
															max={50}
															placeholder="5"
															{...field}
															value={field.value ?? ""}
															onChange={(e) =>
																field.onChange(
																	e.target.value === ""
																		? undefined
																		: Number(e.target.value),
																)
															}
														/>
													</FormControl>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
							</div>

							{captchaEnabled && (
								<TurnstileCaptcha
									ref={turnstileRef}
									onSuccess={handleSuccess}
									onError={handleError}
									onExpire={handleExpire}
								/>
							)}

							{methods.formState.isSubmitted && methods.formState.errors.root && (
								<Alert variant="destructive">
									<AlertDescription>
										{methods.formState.errors.root.message}
									</AlertDescription>
								</Alert>
							)}

							<Button
								className="w-full"
								disabled={isSubmitting || (captchaEnabled && !captchaToken)}
								loading={isSubmitting}
								type="submit"
							>
								Crear cuenta de atleta
							</Button>
						</form>
					</Form>
				)}
			</CardContent>
			<CardFooter className="flex justify-center gap-1 text-muted-foreground text-sm">
				<span>¿Ya tienes una cuenta?</span>
				<Link className="text-foreground underline" href="/auth/sign-in">
					Iniciar sesión
				</Link>
			</CardFooter>
		</Card>
	);
}
