import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	CalendarIcon,
	CheckCircle2Icon,
	ClockIcon,
	MapPinIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/trpc/server";

interface SuccessPageProps {
	params: Promise<{
		orgSlug: string;
		eventSlug: string;
	}>;
	searchParams: Promise<{
		id?: string;
		number?: string;
	}>;
}

export default async function RegistrationSuccessPage({
	params,
	searchParams,
}: SuccessPageProps) {
	const { orgSlug, eventSlug } = await params;
	const { id: registrationId, number: registrationNumber } = await searchParams;

	if (!registrationId) {
		notFound();
	}

	// Fetch event data
	const event = await trpc.public.event
		.getBySlug({
			organizationSlug: orgSlug,
			eventSlug,
		})
		.catch(() => {
			notFound();
			return null;
		});

	if (!event) {
		notFound();
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-16">
			<div className="mb-8 text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
					<CheckCircle2Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
				</div>
				<h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
					Inscripción exitosa
				</h1>
				<p className="mt-2 text-muted-foreground">
					Tu inscripción ha sido registrada correctamente
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{event.title}</CardTitle>
					<CardDescription>Detalles de tu inscripción</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Registration Number */}
					<div className="rounded-lg border bg-muted/30 p-4 text-center">
						<p className="text-sm text-muted-foreground">
							Número de inscripción
						</p>
						<p className="text-3xl font-bold">#{registrationNumber}</p>
					</div>

					{/* Event Details */}
					<div className="space-y-3">
						<div className="flex items-center gap-3 text-sm">
							<CalendarIcon className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="font-medium">Fecha</p>
								<p className="text-muted-foreground">
									{format(new Date(event.startDate), "EEEE d 'de' MMMM, yyyy", {
										locale: es,
									})}
								</p>
							</div>
						</div>

						{event.startDate && (
							<div className="flex items-center gap-3 text-sm">
								<ClockIcon className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="font-medium">Hora</p>
									<p className="text-muted-foreground">
										{format(new Date(event.startDate), "HH:mm", { locale: es })}{" "}
										hs
									</p>
								</div>
							</div>
						)}

						{event.location && (
							<div className="flex items-center gap-3 text-sm">
								<MapPinIcon className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="font-medium">Ubicación</p>
									<p className="text-muted-foreground">
										{event.location.name}
										{event.location.address && `, ${event.location.address}`}
										{event.location.city && `, ${event.location.city}`}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Next Steps */}
					<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
						<h3 className="font-semibold text-amber-800 dark:text-amber-200">
							Próximos pasos
						</h3>
						<ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
							<li>
								Recibirás un email con los detalles de pago y confirmación.
							</li>
							<li>
								Completa el pago antes de la fecha límite para asegurar tu
								lugar.
							</li>
							<li>
								El organizador te contactará con información adicional sobre el
								evento.
							</li>
						</ul>
					</div>

					{/* Contact Info */}
					{event.contactEmail && (
						<div className="text-center text-sm text-muted-foreground">
							<p>
								¿Preguntas? Contacta al organizador en{" "}
								<a
									href={`mailto:${event.contactEmail}`}
									className="text-primary underline underline-offset-4"
								>
									{event.contactEmail}
								</a>
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="mt-8 text-center">
				<Button asChild variant="outline">
					<Link href="/">Volver al inicio</Link>
				</Button>
			</div>
		</div>
	);
}

export async function generateMetadata({ params }: SuccessPageProps) {
	const { orgSlug, eventSlug } = await params;

	try {
		const event = await trpc.public.event.getBySlug({
			organizationSlug: orgSlug,
			eventSlug,
		});

		return {
			title: `Inscripción confirmada - ${event.title}`,
			description: `Tu inscripción a ${event.title} ha sido registrada`,
		};
	} catch {
		return {
			title: "Inscripción confirmada",
		};
	}
}
