"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
	BanknoteIcon,
	CalendarDaysIcon,
	CheckCircleIcon,
	ClockIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { WelcomeSection } from "@/components/organization/dashboard/welcome-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/billing/utils";
import { trpc } from "@/trpc/client";

export function AthleteDashboard() {
	const t = useTranslations("dashboard.athlete");
	const locale = useLocale();
	const dateLocale = locale === "es" ? es : enUS;

	const dateFormat =
		locale === "es" ? "EEEE d 'de' MMMM, HH:mm" : "EEEE MMMM d, HH:mm";

	const { data: groupsData, isLoading: isLoadingGroups } =
		trpc.organization.athleteGroup.listMyGroups.useQuery();
	const { data: paymentsData, isLoading: isLoadingPayments } =
		trpc.organization.trainingPayment.listMyPayments.useQuery();
	const { data: sessionsData, isLoading: isLoadingSessions } =
		trpc.organization.trainingSession.listMySessionsAsAthlete.useQuery({});

	const groups = groupsData?.groups ?? [];
	const payments = paymentsData?.payments ?? [];
	const summary = paymentsData?.summary ?? { total: 0, paid: 0, pending: 0 };

	// Get upcoming sessions (next 7 days)
	const now = new Date();
	const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const upcomingSessions = (sessionsData?.sessions ?? [])
		.filter((s) => {
			const sessionDate = new Date(s.startTime);
			return sessionDate >= now && sessionDate <= nextWeek;
		})
		.slice(0, 5);

	return (
		<div className="fade-in flex animate-in flex-col space-y-4 duration-500">
			{/* Welcome Section */}
			<WelcomeSection variant="athlete" />

			{/* Row 1: Quick stats */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Groups */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("myGroups")}
						</CardTitle>
						<UsersIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoadingGroups ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="font-bold text-2xl">{groups.length}</div>
								<p className="text-muted-foreground text-xs">
									{t("activeGroups", { count: groups.length })}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Upcoming Sessions */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("upcomingSessions")}
						</CardTitle>
						<CalendarDaysIcon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoadingSessions ? (
							<Skeleton className="h-8 w-16" />
						) : (
							<>
								<div className="font-bold text-2xl">
									{upcomingSessions.length}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("next7Days")}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Paid */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">{t("paid")}</CardTitle>
						<CheckCircleIcon className="size-4 text-green-600" />
					</CardHeader>
					<CardContent>
						{isLoadingPayments ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="font-bold text-2xl text-green-600">
									{formatCurrency(summary.paid, "ARS")}
								</div>
								<p className="text-muted-foreground text-xs">
									{t("totalPaid")}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Pending */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							{t("pending")}
						</CardTitle>
						<ClockIcon className="size-4 text-yellow-600" />
					</CardHeader>
					<CardContent>
						{isLoadingPayments ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="font-bold text-2xl text-yellow-600">
									{formatCurrency(summary.pending, "ARS")}
								</div>
								<p className="text-muted-foreground text-xs">{t("toPay")}</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Row 2: Upcoming sessions + Groups */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Upcoming Sessions Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CalendarDaysIcon className="size-5" />
							{t("upcomingSessions")}
						</CardTitle>
						<CardDescription>{t("weekTrainings")}</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingSessions ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-16" />
								))}
							</div>
						) : upcomingSessions.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<CalendarDaysIcon className="size-10 text-muted-foreground/50" />
								<p className="mt-2 text-muted-foreground text-sm">
									{t("noSessionsThisWeek")}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{upcomingSessions.map((session) => (
									<div
										key={session.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{session.title}</p>
											<p className="text-muted-foreground text-sm">
												{format(new Date(session.startTime), dateFormat, {
													locale: dateLocale,
												})}
											</p>
										</div>
										{session.location && (
											<Badge variant="outline">{session.location.name}</Badge>
										)}
									</div>
								))}
								<Button variant="outline" className="w-full" asChild>
									<Link href="/dashboard/organization/my-calendar">
										{t("viewFullCalendar")}
									</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Groups Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UsersIcon className="size-5" />
							{t("myGroups")}
						</CardTitle>
						<CardDescription>{t("groupsBelong")}</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoadingGroups ? (
							<div className="space-y-3">
								{[1, 2].map((i) => (
									<Skeleton key={i} className="h-16" />
								))}
							</div>
						) : groups.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<UsersIcon className="size-10 text-muted-foreground/50" />
								<p className="mt-2 text-muted-foreground text-sm">
									{t("noGroupsYet")}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{groups.slice(0, 4).map((group) => (
									<div
										key={group.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{group.name}</p>
											{group.description && (
												<p className="line-clamp-1 text-muted-foreground text-sm">
													{group.description}
												</p>
											)}
										</div>
										<Badge variant="secondary">
											{group.memberCount}{" "}
											{t("members", { count: group.memberCount })}
										</Badge>
									</div>
								))}
								{groups.length > 4 && (
									<Button variant="outline" className="w-full" asChild>
										<Link href="/dashboard/organization/my-groups">
											{t("viewAllGroups")}
										</Link>
									</Button>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Row 3: Recent Payments */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BanknoteIcon className="size-5" />
						{t("recentPayments")}
					</CardTitle>
					<CardDescription>{t("paymentHistory")}</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoadingPayments ? (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12" />
							))}
						</div>
					) : payments.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<BanknoteIcon className="size-10 text-muted-foreground/50" />
							<p className="mt-2 text-muted-foreground text-sm">
								{t("noPayments")}
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{payments.slice(0, 5).map((payment) => (
								<div
									key={payment.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-3">
										<div
											className={`rounded-full p-2 ${
												payment.status === "paid"
													? "bg-green-100 text-green-600 dark:bg-green-900"
													: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900"
											}`}
										>
											{payment.status === "paid" ? (
												<CheckCircleIcon className="size-4" />
											) : (
												<ClockIcon className="size-4" />
											)}
										</div>
										<div>
											<p className="font-medium">
												{payment.description ||
													payment.session?.title ||
													t("payment")}
											</p>
											<p className="text-muted-foreground text-xs">
												{format(new Date(payment.createdAt), "dd/MM/yyyy")}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-medium">
											{formatCurrency(payment.amount, payment.currency)}
										</p>
										<Badge
											variant="secondary"
											className={
												payment.status === "paid"
													? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
													: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
											}
										>
											{payment.status === "paid"
												? t("statusPaid")
												: t("statusPending")}
										</Badge>
									</div>
								</div>
							))}
							{payments.length > 5 && (
								<Button variant="outline" className="w-full" asChild>
									<Link href="/dashboard/organization/my-payments">
										{t("viewAllPayments")}
									</Link>
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
