"use client";

import { LockIcon, UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CashRegisterStatus } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";

interface CashRegisterStatusBadgeProps {
	status: string;
}

export function CashRegisterStatusBadge({
	status,
}: CashRegisterStatusBadgeProps) {
	const t = useTranslations("finance.cashRegister");

	const isOpen = status === CashRegisterStatus.open;

	return (
		<Badge
			className={cn(
				"flex w-fit items-center gap-1.5 border-none px-2 py-0.5 font-medium text-xs shadow-none",
				isOpen
					? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
					: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
			)}
			variant="outline"
		>
			{isOpen ? (
				<>
					<UnlockIcon className="size-3" />
					{t("history.statusOpen")}
				</>
			) : (
				<>
					<LockIcon className="size-3" />
					{t("history.statusClosed")}
				</>
			)}
		</Badge>
	);
}
