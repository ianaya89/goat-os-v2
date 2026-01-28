"use client";

import { CashMovementsTable } from "@/components/organization/cash-movements-table";
import { CashRegisterStatus } from "@/lib/db/schema/enums";
import { trpc } from "@/trpc/client";

interface CashRegisterMovementsWrapperProps {
	cashRegisterId?: string;
}

export function CashRegisterMovementsWrapper({
	cashRegisterId,
}: CashRegisterMovementsWrapperProps = {}) {
	const { data: currentRegister } =
		trpc.organization.cashRegister.getCurrent.useQuery(undefined, {
			enabled: !cashRegisterId,
		});

	// Don't show movements for today's closed register
	if (
		!cashRegisterId &&
		currentRegister?.status === CashRegisterStatus.closed
	) {
		return null;
	}

	const resolvedId = cashRegisterId ?? currentRegister?.id;

	if (!resolvedId) {
		return null;
	}

	return <CashMovementsTable cashRegisterId={resolvedId} />;
}
