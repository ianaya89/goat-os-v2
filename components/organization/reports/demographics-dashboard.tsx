"use client";

import type * as React from "react";
import { DemographicsAgeChart } from "./demographics-age-chart";
import { DemographicsCategoryChart } from "./demographics-category-chart";
import { DemographicsClubChart } from "./demographics-club-chart";
import { DemographicsDominantFootChart } from "./demographics-dominant-foot-chart";
import { DemographicsDominantHandChart } from "./demographics-dominant-hand-chart";
import { DemographicsExperienceChart } from "./demographics-experience-chart";
import { DemographicsGrowthChart } from "./demographics-growth-chart";
import { DemographicsLevelChart } from "./demographics-level-chart";
import { DemographicsNationalityChart } from "./demographics-nationality-chart";
import { DemographicsPositionChart } from "./demographics-position-chart";
import { DemographicsResidenceChart } from "./demographics-residence-chart";
import { DemographicsSexChart } from "./demographics-sex-chart";
import { DemographicsSportChart } from "./demographics-sport-chart";
import { DemographicsSummaryCards } from "./demographics-summary-cards";

export function DemographicsDashboard(): React.JSX.Element {
	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<DemographicsSummaryCards />

			{/* Growth Chart - Full Width */}
			<DemographicsGrowthChart />

			{/* Row 1: Age + Sex */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsAgeChart />
				<DemographicsSexChart />
			</div>

			{/* Row 2: Sport + Level */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsSportChart />
				<DemographicsLevelChart />
			</div>

			{/* Row 3: Category + Experience */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsCategoryChart />
				<DemographicsExperienceChart />
			</div>

			{/* Row 4: Club + Nationality */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsClubChart />
				<DemographicsNationalityChart />
			</div>

			{/* Row 5: Residence + Position */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsResidenceChart />
				<DemographicsPositionChart />
			</div>

			{/* Row 6: Dominant Foot + Dominant Hand */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<DemographicsDominantFootChart />
				<DemographicsDominantHandChart />
			</div>
		</div>
	);
}
