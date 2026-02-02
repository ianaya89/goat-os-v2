"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { PaymentsTable } from "@/components/organization/payments-table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function AthletePaymentsTableWrapper(): React.JSX.Element {
	const t = useTranslations("finance.payments");

	// Get athlete id for current user in this organization
	const { data, isLoading } =
		trpc.organization.trainingPayment.listMyPayments.useQuery();

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!data?.athlete) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">{t("myPayments.notAthlete")}</p>
			</div>
		);
	}

	return <PaymentsTable readOnly athleteId={data.athlete.id} />;
}
