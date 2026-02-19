"use client";

import { TagsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
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

type ExpensesByCategoryChartProps = {
	dateRange: { from: Date; to: Date };
};

export function ExpensesByCategoryChart({
	dateRange,
}: ExpensesByCategoryChartProps): React.JSX.Element {
	const t = useTranslations("finance.expenses");

	const { data, isLoading } =
		trpc.organization.reports.getExpensesByCategory.useQuery({
			dateRange,
		});

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount / 100);
	};

	const translateCategory = (name: string): string => {
		try {
			return t(`categories.${name}`);
		} catch {
			return name;
		}
	};

	const chartData =
		data?.map((item) => {
			const translated = translateCategory(item.categoryName);
			return {
				name:
					translated.length > 18 ? `${translated.slice(0, 18)}...` : translated,
				fullName: translated,
				value: item.total,
				count: item.count,
			};
		}) ?? [];

	const totalExpenses = chartData.reduce((acc, item) => acc + item.value, 0);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TagsIcon className="h-5 w-5 text-primary" />
					Gastos por Categoria
				</CardTitle>
				<CardDescription>
					Total: {formatAmount(totalExpenses)} en {chartData.length} categorias
				</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						No hay datos de gastos por categoria
					</div>
				) : (
					<div className="h-[300px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) =>
										new Intl.NumberFormat("es-AR", {
											notation: "compact",
											compactDisplay: "short",
										}).format(value / 100)
									}
								/>
								<YAxis
									type="category"
									dataKey="name"
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									width={110}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0].payload as {
												fullName: string;
												value: number;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-1 text-sm font-medium">
														{item.fullName}
													</p>
													<p className="text-red-600 font-medium">
														{formatAmount(item.value)}
													</p>
													<p className="text-muted-foreground text-xs">
														{item.count} gastos
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
