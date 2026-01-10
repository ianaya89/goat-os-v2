"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { EventForm } from "@/components/organization/event-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

interface EventEditFormProps {
	eventId: string;
}

export function EventEditForm({ eventId }: EventEditFormProps): React.JSX.Element {
	const router = useRouter();

	const { data, isPending, error } = trpc.organization.sportsEvent.get.useQuery(
		{ id: eventId },
		{ retry: false },
	);

	if (isPending) {
		return <EventEditFormSkeleton />;
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<p className="text-muted-foreground">Evento no encontrado</p>
				<Button
					variant="link"
					onClick={() => router.push("/dashboard/organization/events")}
				>
					Volver a eventos
				</Button>
			</div>
		);
	}

	return <EventForm event={data} eventId={eventId} />;
}

function EventEditFormSkeleton(): React.JSX.Element {
	return (
		<div className="space-y-6 max-w-3xl">
			{/* Card skeleton */}
			{[1, 2, 3, 4, 5].map((i) => (
				<div key={i} className="rounded-lg border p-6 space-y-4">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-64" />
					<div className="space-y-4 pt-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<div className="grid grid-cols-2 gap-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				</div>
			))}
			<div className="flex justify-end gap-3">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-10 w-32" />
			</div>
		</div>
	);
}
