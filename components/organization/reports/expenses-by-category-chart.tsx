"use client";

import { TagsIcon } from "lucide-react";
import type * as React from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
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

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#8884D8",
	"#82CA9D",
	"#FFC658",
	"#8DD1E1",
];

export function ExpensesByCategoryChart({
	dateRange,
}: ExpensesByCategoryChartProps): React.JSX.Element {
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

	const chartData =
		data?.map((item, index) => ({
			name: item.categoryName,
			value: item.total,
			count: item.count,
			fill: COLORS[index % COLORS.length],
		})) ?? [];

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
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									labelLine={false}
									outerRadius={100}
									fill="#8884d8"
									dataKey="value"
									label={({ name, percent }) =>
										`${name} (${(percent * 100).toFixed(0)}%)`
									}
								>
									{chartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
								</Pie>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0 && payload[0]) {
											const item = payload[0].payload as {
												name: string;
												value: number;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="mb-1 text-sm font-medium">
														{item.name}
													</p>
													<p className="text-red-600 text-sm">
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
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
