"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CalendarIcon,
	CheckCircle2Icon,
	LockIcon,
	MailIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PasswordFormMessage } from "@/components/auth/password-form-message";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Progress } from "@/components/ui/progress";
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
import { AthleteLevel } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { athleteSignUpSchema } from "@/schemas/auth-schemas";

const athleteLevelLabels: Record<string, string> = {
	[AthleteLevel.beginner]: "Principiante",
	[AthleteLevel.intermediate]: "Intermedio",
	[AthleteLevel.advanced]: "Avanzado",
	[AthleteLevel.elite]: "Elite",
};

const STEPS = [
	{ id: 1, name: "Cuenta" },
	{ id: 2, name: "Deportivo" },
	{ id: 3, name: "Perfil" },
];

export function AthleteSignUpCard() {
	const [currentStep, setCurrentStep] = useState(1);
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
			phone: "",
			sport: "",
			level: AthleteLevel.beginner,
			currentClub: "",
			category: "",
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

	const validateCurrentStep = async (): Promise<boolean> => {
		switch (currentStep) {
			case 1:
				return methods.trigger(["name", "email", "password", "phone"]);
			case 2:
				return methods.trigger([
					"sport",
					"level",
					"currentClub",
					"category",
					"position",
				]);
			case 3:
				return methods.trigger(["birthDate"]);
			default:
				return true;
		}
	};

	const handleNext = async () => {
		const isValid = await validateCurrentStep();
		if (isValid && currentStep < STEPS.length) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const progressValue = (currentStep / STEPS.length) * 100;

	if (submitSuccess) {
		return (
			<div className="flex flex-col items-center gap-6 py-8">
				<div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
					<CheckCircle2Icon className="size-8 text-green-600 dark:text-green-400" />
				</div>
				<div className="space-y-2 text-center">
					<h2 className="font-semibold text-xl">¡Registro exitoso!</h2>
					<p className="text-muted-foreground">
						Te hemos enviado un enlace para verificar tu email. Por favor revisa
						tu bandeja de entrada.
					</p>
				</div>
				<Button asChild variant="outline" className="w-full">
					<Link href="/auth/sign-in">Ir a iniciar sesión</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="space-y-2">
				<h1 className="font-semibold text-2xl tracking-tight">
					Crear cuenta de atleta
				</h1>
				<p className="text-muted-foreground text-sm">
					Completa el formulario para registrarte en la plataforma.
				</p>
			</div>

			{/* Progress */}
			<div className="space-y-3">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						Paso {currentStep} de {STEPS.length}
					</span>
					<span className="font-medium">{STEPS[currentStep - 1]?.name}</span>
				</div>
				<Progress value={progressValue} className="h-2" />
			</div>

			{/* Form */}
			<Form {...methods}>
				<form onSubmit={onSubmit} className="space-y-4">
					{/* Step 1: Account Information */}
					<div className={cn("space-y-4", currentStep !== 1 && "hidden")}>
						<FormField
							control={methods.control}
							name="name"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Nombre completo</FormLabel>
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
										<FormLabel>Email</FormLabel>
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
						<FormField
							control={methods.control}
							name="phone"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Teléfono</FormLabel>
										<FormControl>
											<InputGroup>
												<InputGroupAddon align="inline-start">
													<InputGroupText>
														<PhoneIcon className="size-4 shrink-0" />
													</InputGroupText>
												</InputGroupAddon>
												<InputGroupInput
													autoComplete="tel"
													disabled={isSubmitting}
													maxLength={20}
													type="tel"
													placeholder="+54 11 1234-5678"
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
							name="password"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Contraseña</FormLabel>
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

					{/* Step 2: Sports Information */}
					<div className={cn("space-y-4", currentStep !== 2 && "hidden")}>
						<FormField
							control={methods.control}
							name="sport"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Deporte</FormLabel>
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
							name="currentClub"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Club actual</FormLabel>
										<FormControl>
											<Input
												disabled={isSubmitting}
												maxLength={100}
												type="text"
												placeholder="Nombre del club"
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
							name="category"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Categoría</FormLabel>
										<FormControl>
											<Input
												disabled={isSubmitting}
												maxLength={50}
												type="text"
												placeholder="Sub-17, Primera, etc."
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
							name="level"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Nivel</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={isSubmitting}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Selecciona tu nivel" />
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
							name="position"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Posición</FormLabel>
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
					</div>

					{/* Step 3: Profile */}
					<div className={cn("space-y-4", currentStep !== 3 && "hidden")}>
						<FormField
							control={methods.control}
							name="birthDate"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Fecha de nacimiento</FormLabel>
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
														date > new Date() || date < new Date("1940-01-01")
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
							name="secondaryPosition"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>Posición secundaria (opcional)</FormLabel>
										<FormControl>
											<Input
												disabled={isSubmitting}
												maxLength={100}
												type="text"
												placeholder="Mediocampista, Escolta, etc."
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
							name="jerseyNumber"
							render={({ field }) => (
								<FormItem asChild>
									<Field>
										<FormLabel>N° de camiseta (opcional)</FormLabel>
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
					</div>

					{/* Navigation buttons */}
					<div className="flex gap-3 pt-2">
						{currentStep > 1 && (
							<Button
								type="button"
								variant="outline"
								onClick={handlePrevious}
								disabled={isSubmitting}
								className="flex-1"
							>
								<ArrowLeftIcon className="mr-2 size-4" />
								Anterior
							</Button>
						)}
						{currentStep < STEPS.length ? (
							<Button
								type="button"
								onClick={handleNext}
								disabled={isSubmitting}
								className="flex-1"
							>
								Siguiente
								<ArrowRightIcon className="ml-2 size-4" />
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting || (captchaEnabled && !captchaToken)}
								loading={isSubmitting}
								className="flex-1"
							>
								Crear cuenta
							</Button>
						)}
					</div>
				</form>
			</Form>

			{/* Footer */}
			<p className="text-center text-muted-foreground text-sm">
				¿Ya tienes una cuenta?{" "}
				<Link className="text-foreground underline" href="/auth/sign-in">
					Iniciar sesión
				</Link>
			</p>
		</div>
	);
}
