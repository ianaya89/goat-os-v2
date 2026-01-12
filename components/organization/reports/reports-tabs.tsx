"use client";

import { BarChart3Icon, DumbbellIcon } from "lucide-react";
import type * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDashboard } from "./financial-dashboard";
import { TrainingDashboard } from "./training-dashboard";

export function ReportsTabs(): React.JSX.Element {
	return (
		<Tabs defaultValue="financial" className="w-full">
			<TabsList className="mb-6">
				<TabsTrigger value="financial" className="gap-2">
					<BarChart3Icon className="h-4 w-4" />
					Financieros
				</TabsTrigger>
				<TabsTrigger value="training" className="gap-2">
					<DumbbellIcon className="h-4 w-4" />
					Entrenamientos
				</TabsTrigger>
			</TabsList>
			<TabsContent value="financial">
				<FinancialDashboard />
			</TabsContent>
			<TabsContent value="training">
				<TrainingDashboard />
			</TabsContent>
		</Tabs>
	);
}
