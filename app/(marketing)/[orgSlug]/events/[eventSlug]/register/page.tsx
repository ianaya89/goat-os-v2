import { notFound } from "next/navigation";
import { EventRegistrationWizard } from "@/components/public/event-registration/event-registration-wizard";
import { HydrateClient, trpc } from "@/trpc/server";

interface EventRegistrationPageProps {
	params: Promise<{
		orgSlug: string;
		eventSlug: string;
	}>;
}

export default async function EventRegistrationPage({
	params,
}: EventRegistrationPageProps) {
	const { orgSlug, eventSlug } = await params;

	// Fetch event data server-side
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

	// Check if registration is open
	if (!event.isRegistrationOpen) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 text-center">
				<h1 className="text-2xl font-bold">{event.title}</h1>
				<p className="mt-4 text-muted-foreground">
					Las inscripciones para este evento no están disponibles en este
					momento.
				</p>
				{event.registrationCloseDate && (
					<p className="mt-2 text-sm text-muted-foreground">
						Las inscripciones cerraron el{" "}
						{new Date(event.registrationCloseDate).toLocaleDateString("es-AR", {
							day: "numeric",
							month: "long",
							year: "numeric",
						})}
					</p>
				)}
			</div>
		);
	}

	// Check if event is full
	if (
		event.spotsAvailable !== null &&
		event.spotsAvailable <= 0 &&
		!event.enableWaitlist
	) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-16 text-center">
				<h1 className="text-2xl font-bold">{event.title}</h1>
				<p className="mt-4 text-muted-foreground">
					Este evento ha alcanzado su capacidad máxima y no hay lista de espera
					disponible.
				</p>
			</div>
		);
	}

	// Transform event data to match component expectations
	const eventData = {
		id: event.id,
		title: event.title,
		slug: event.slug,
		description: event.description,
		startDate: new Date(event.startDate),
		endDate: event.endDate ? new Date(event.endDate) : null,
		currency: event.currency,
		location: event.location,
		ageCategories: event.ageCategories.map((ec) => ({
			ageCategory: {
				id: ec.ageCategory.id,
				name: ec.ageCategory.name,
				displayName: ec.ageCategory.displayName,
				minBirthYear: ec.ageCategory.minBirthYear,
				maxBirthYear: ec.ageCategory.maxBirthYear,
			},
			maxCapacity: ec.maxCapacity,
			currentRegistrations: ec.currentRegistrations,
		})),
	};

	return (
		<HydrateClient>
			<EventRegistrationWizard
				event={eventData}
				organizationSlug={orgSlug}
				eventSlug={eventSlug}
			/>
		</HydrateClient>
	);
}

export async function generateMetadata({ params }: EventRegistrationPageProps) {
	const { orgSlug, eventSlug } = await params;

	try {
		const event = await trpc.public.event.getBySlug({
			organizationSlug: orgSlug,
			eventSlug,
		});

		return {
			title: `Inscripción - ${event.title}`,
			description: `Inscríbete en ${event.title}`,
		};
	} catch {
		return {
			title: "Inscripción a evento",
		};
	}
}
