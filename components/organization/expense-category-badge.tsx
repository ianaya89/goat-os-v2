import {
	BanknoteIcon,
	BriefcaseIcon,
	BuildingIcon,
	FolderIcon,
	HeartPulseIcon,
	LaptopIcon,
	MegaphoneIcon,
	PackageIcon,
	ShieldIcon,
	TagIcon,
	TruckIcon,
	WrenchIcon,
} from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const categoryConfig: Record<
	string,
	{ bg: string; text: string; icon: React.ElementType }
> = {
	field_rental: {
		bg: "bg-green-50 dark:bg-green-950",
		text: "text-green-700 dark:text-green-300",
		icon: BuildingIcon,
	},
	equipment: {
		bg: "bg-blue-50 dark:bg-blue-950",
		text: "text-blue-700 dark:text-blue-300",
		icon: PackageIcon,
	},
	sports_materials: {
		bg: "bg-orange-50 dark:bg-orange-950",
		text: "text-orange-700 dark:text-orange-300",
		icon: PackageIcon,
	},
	transport: {
		bg: "bg-cyan-50 dark:bg-cyan-950",
		text: "text-cyan-700 dark:text-cyan-300",
		icon: TruckIcon,
	},
	salaries: {
		bg: "bg-purple-50 dark:bg-purple-950",
		text: "text-purple-700 dark:text-purple-300",
		icon: BriefcaseIcon,
	},
	commissions: {
		bg: "bg-violet-50 dark:bg-violet-950",
		text: "text-violet-700 dark:text-violet-300",
		icon: BanknoteIcon,
	},
	utilities: {
		bg: "bg-yellow-50 dark:bg-yellow-950",
		text: "text-yellow-700 dark:text-yellow-300",
		icon: WrenchIcon,
	},
	marketing: {
		bg: "bg-pink-50 dark:bg-pink-950",
		text: "text-pink-700 dark:text-pink-300",
		icon: MegaphoneIcon,
	},
	insurance: {
		bg: "bg-teal-50 dark:bg-teal-950",
		text: "text-teal-700 dark:text-teal-300",
		icon: ShieldIcon,
	},
	maintenance: {
		bg: "bg-amber-50 dark:bg-amber-950",
		text: "text-amber-700 dark:text-amber-300",
		icon: WrenchIcon,
	},
	facilities: {
		bg: "bg-indigo-50 dark:bg-indigo-950",
		text: "text-indigo-700 dark:text-indigo-300",
		icon: BuildingIcon,
	},
	medical: {
		bg: "bg-red-50 dark:bg-red-950",
		text: "text-red-700 dark:text-red-300",
		icon: HeartPulseIcon,
	},
	technology: {
		bg: "bg-slate-50 dark:bg-slate-900",
		text: "text-slate-700 dark:text-slate-300",
		icon: LaptopIcon,
	},
	other: {
		bg: "bg-gray-50 dark:bg-gray-900",
		text: "text-gray-700 dark:text-gray-300",
		icon: TagIcon,
	},
};

const fallbackConfig = {
	bg: "bg-gray-50 dark:bg-gray-900",
	text: "text-gray-700 dark:text-gray-300",
	icon: FolderIcon,
};

type ExpenseCategoryBadgeProps = {
	name: string;
	category?: string | null;
	className?: string;
};

export function ExpenseCategoryBadge({
	name,
	category,
	className,
}: ExpenseCategoryBadgeProps): React.JSX.Element {
	const config = categoryConfig[category ?? ""] ?? fallbackConfig;
	const Icon = config.icon;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium max-w-[160px]",
				config.bg,
				config.text,
				className,
			)}
		>
			<Icon className="size-3 shrink-0" />
			<span className="truncate">{name}</span>
		</span>
	);
}
