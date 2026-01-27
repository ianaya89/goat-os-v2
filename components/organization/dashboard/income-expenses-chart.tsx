"use client";

import { format, subMonths } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export function IncomeExpensesChart(): React.JSX.Element {
	const t = useTranslations("dashboard.incomeExpenses");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const sixMonthsAgo = subMonths(new Date(), 6);

	const { data, isLoading, error } =
		trpc.organization.reports.getCashFlowReport.useQuery({
			period: "month",
			dateRange: {
				from: sixMonthsAgo,
				to: new Date(),
			},
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
			style: "currency",
			currency: "ARS",
			notation: "compact",
		}).format(amount / 100);
	};

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<WalletIcon className="size-5 text-emerald-500" />
						{t("title")}
					</CardTitle>
					<CardDescription>{t("last6Months")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<WalletIcon className="size-10 text-destructive/50 mb-2" />
						<p className="text-destructive text-sm">{t("errorLoading")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[200px] w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<WalletIcon className="size-5 text-emerald-500" />
						{t("title")}
					</CardTitle>
					<CardDescription>{t("last6Months")}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center py-8 text-center">
						<WalletIcon className="size-10 text-muted-foreground/50 mb-2" />
						<p className="text-muted-foreground text-sm">{t("noData")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const chartData = data.map((d) => ({
		month: format(new Date(d.period), "MMM", { locale: dateLocale }),
		income: d.revenue / 100,
		expenses: d.expenses / 100,
		net: d.net / 100,
	}));

	// Calculate totals
	const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
	const totalExpenses = data.reduce((acc, d) => acc + d.expenses, 0);
	const totalNet = totalRevenue - totalExpenses;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<WalletIcon className="size-5 text-emerald-500" />
							{t("title")}
						</CardTitle>
						<CardDescription>{t("description")}</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Summary Stats */}
				<div className="grid grid-cols-3 gap-2">
					<div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950">
						<div className="flex items-center justify-center gap-1">
							<ArrowUpIcon className="size-3 text-green-600" />
							<span className="text-xs text-muted-foreground">
								{t("income")}
							</span>
						</div>
						<p className="font-bold text-green-600 text-sm">
							{formatAmount(totalRevenue)}
						</p>
					</div>
					<div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950">
						<div className="flex items-center justify-center gap-1">
							<ArrowDownIcon className="size-3 text-red-600" />
							<span className="text-xs text-muted-foreground">
								{t("expenses")}
							</span>
						</div>
						<p className="font-bold text-red-600 text-sm">
							{formatAmount(totalExpenses)}
						</p>
					</div>
					<div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950">
						<span className="text-xs text-muted-foreground">{t("net")}</span>
						<p
							className={`font-bold text-sm ${totalNet >= 0 ? "text-blue-600" : "text-red-600"}`}
						>
							{formatAmount(totalNet)}
						</p>
					</div>
				</div>

				{/* Chart */}
				<ResponsiveContainer width="100%" height={180}>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
							</linearGradient>
							<linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
							</linearGradient>
						</defs>
						<XAxis
							dataKey="month"
							fontSize={12}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							fontSize={12}
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) =>
								new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US", {
									notation: "compact",
								}).format(value)
							}
						/>
						<Tooltip
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const data = payload[0]?.payload;
									return (
										<div className="rounded-lg border bg-background p-2 shadow-sm">
											<p className="font-medium text-sm capitalize">
												{data.month}
											</p>
											<p className="text-xs text-green-600">
												{t("income")}: {formatAmount(data.income * 100)}
											</p>
											<p className="text-xs text-red-600">
												{t("expenses")}: {formatAmount(data.expenses * 100)}
											</p>
											<p className="text-xs text-blue-600 font-medium">
												{t("net")}: {formatAmount(data.net * 100)}
											</p>
										</div>
									);
								}
								return null;
							}}
						/>
						<Area
							type="monotone"
							dataKey="income"
							stroke="#22c55e"
							fill="url(#colorIncome)"
							strokeWidth={2}
						/>
						<Area
							type="monotone"
							dataKey="expenses"
							stroke="#ef4444"
							fill="url(#colorExpenses)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
