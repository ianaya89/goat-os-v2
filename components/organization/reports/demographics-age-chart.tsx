"use client";

import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
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

const BAR_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

const AGE_ORDER = [
	"5-6",
	"7-8",
	"9-10",
	"11-12",
	"13-14",
	"15-16",
	"17-18",
	"19-20",
	"21-25",
	"26-30",
	"31-35",
	"36+",
	"N/A",
];

export function DemographicsAgeChart(): React.JSX.Element {
	const t = useTranslations("organization.pages.reports.demographics");
	const { data, isLoading } =
		trpc.organization.reports.getDemographics.useQuery({});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
			</Card>
		);
	}

	const chartData = (data?.age ?? [])
		.sort((a, b) => AGE_ORDER.indexOf(a.range) - AGE_ORDER.indexOf(b.range))
		.map((item) => ({
			name: item.range,
			count: item.count,
		}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarIcon className="h-5 w-5 text-blue-600" />
					{t("charts.age.title")}
				</CardTitle>
				<CardDescription>{t("charts.age.description")}</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[250px] items-center justify-center text-muted-foreground">
						{t("noData")}
					</div>
				) : (
					<div className="h-[250px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									type="number"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									dataKey="name"
									type="category"
									tick={{ fontSize: 12 }}
									tickLine={false}
									axisLine={false}
									width={50}
								/>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length > 0) {
											const d = payload[0]?.payload as {
												name: string;
												count: number;
											};
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<p className="text-sm font-medium">
														{t("charts.age.range")}: {d.name}
													</p>
													<p className="text-sm text-muted-foreground">
														{d.count} {t("charts.athletes")}
													</p>
												</div>
											);
										}
										return null;
									}}
								/>
								<Bar dataKey="count" radius={[0, 4, 4, 0]}>
									{chartData.map((_, index) => (
										<Cell
											key={`cell-${index}`}
											fill={BAR_COLORS[index % BAR_COLORS.length]}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
