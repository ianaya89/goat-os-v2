"use client";

import { FilterIcon, Loader2Icon, SearchIcon, UsersIcon } from "lucide-react";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryState,
} from "nuqs";
import { Suspense, useState } from "react";
import { AthleteCard } from "@/components/marketing/athletes/athlete-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { appConfig } from "@/config/app.config";
import {
	type AthleteLevel,
	AthleteLevels,
	type AthleteOpportunityType,
	AthleteOpportunityTypes,
	type AthleteSport,
	AthleteSports,
} from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const sportLabels: Record<AthleteSport, string> = {
	soccer: "Futbol",
	basketball: "Basketball",
	volleyball: "Volleyball",
	tennis: "Tenis",
	swimming: "Natacion",
	athletics: "Atletismo",
	rugby: "Rugby",
	hockey: "Hockey",
	baseball: "Baseball",
	handball: "Handball",
	padel: "Padel",
	golf: "Golf",
	boxing: "Boxeo",
	martial_arts: "Artes Marciales",
	gymnastics: "Gimnasia",
	cycling: "Ciclismo",
	running: "Running",
	fitness: "Fitness",
	crossfit: "CrossFit",
	other: "Otro",
};

const levelLabels: Record<AthleteLevel, string> = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
	elite: "Elite",
};

const opportunityLabels: Record<AthleteOpportunityType, string> = {
	professional_team: "Buscando equipo",
	university_scholarship: "Buscando universidad",
	tryouts: "Abierto a pruebas",
	sponsorship: "Buscando sponsor",
	coaching: "Abierto a coaching",
};

function AthletesSearchContent() {
	const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
	const [sport, setSport] = useQueryState("sport", parseAsString);
	const [level, setLevel] = useQueryState("level", parseAsString);
	const [country, setCountry] = useQueryState("country", parseAsString);
	const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
	const [opportunities, setOpportunities] = useQueryState(
		"opp",
		parseAsArrayOf(parseAsString).withDefault([]),
	);

	const limit = appConfig.pagination.defaultLimit;
	const offset = (page - 1) * limit;

	const { data, isLoading, isFetching } = trpc.public.athlete.list.useQuery({
		query: query || undefined,
		sport: sport as AthleteSport | undefined,
		level: level as AthleteLevel | undefined,
		country: country || undefined,
		opportunityTypes:
			opportunities.length > 0
				? (opportunities as AthleteOpportunityType[])
				: undefined,
		limit,
		offset,
	});

	const totalPages = data ? Math.ceil(data.total / limit) : 0;

	const handleOpportunityToggle = (opp: AthleteOpportunityType) => {
		if (opportunities.includes(opp)) {
			setOpportunities(opportunities.filter((o) => o !== opp));
		} else {
			setOpportunities([...opportunities, opp]);
		}
		setPage(1);
	};

	const clearFilters = () => {
		setSport(null);
		setLevel(null);
		setCountry(null);
		setOpportunities([]);
		setPage(1);
	};

	const hasFilters = sport || level || country || opportunities.length > 0;

	return (
		<>
			{/* Hero Section */}
			<section className="border-b bg-gradient-to-b from-muted/50 to-background">
				<div className="container mx-auto px-6 py-16 text-center lg:px-10">
					<div className="mx-auto max-w-3xl">
						<h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">
							Descubre Talentos Deportivos
						</h1>
						<p className="mb-8 text-lg text-muted-foreground">
							Conecta con atletas en busca de oportunidades: equipos
							profesionales, becas universitarias, pruebas, sponsorship y mas.
						</p>

						{/* Search Bar */}
						<div className="relative mx-auto max-w-xl">
							<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-4 size-5 text-muted-foreground" />
							<Input
								placeholder="Buscar atleta por nombre..."
								value={query}
								onChange={(e) => {
									setQuery(e.target.value);
									setPage(1);
								}}
								className="h-12 pl-12 pr-4"
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="container mx-auto px-6 py-12 lg:px-10">
				<div className="flex flex-col gap-8 lg:flex-row">
					{/* Filters Sidebar - Desktop */}
					<aside className="hidden w-64 shrink-0 lg:block">
						<div className="sticky top-24 space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-lg">Filtros</h2>
								{hasFilters && (
									<Button
										variant="ghost"
										size="sm"
										onClick={clearFilters}
										className="text-muted-foreground text-xs"
									>
										Limpiar
									</Button>
								)}
							</div>

							{/* Sport Filter */}
							<div className="space-y-2">
								<Label>Deporte</Label>
								<Select
									value={sport || "all"}
									onValueChange={(v) => {
										setSport(v === "all" ? null : v);
										setPage(1);
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todos" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										{AthleteSports.map((s) => (
											<SelectItem key={s} value={s}>
												{sportLabels[s]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Level Filter */}
							<div className="space-y-2">
								<Label>Nivel</Label>
								<Select
									value={level || "all"}
									onValueChange={(v) => {
										setLevel(v === "all" ? null : v);
										setPage(1);
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Todos" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos</SelectItem>
										{AthleteLevels.map((l) => (
											<SelectItem key={l} value={l}>
												{levelLabels[l]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Opportunities Filter */}
							<div className="space-y-3">
								<Label>Buscando</Label>
								{AthleteOpportunityTypes.map((opp) => (
									<div key={opp} className="flex items-center space-x-2">
										<Checkbox
											id={opp}
											checked={opportunities.includes(opp)}
											onCheckedChange={() => handleOpportunityToggle(opp)}
										/>
										<Label htmlFor={opp} className="cursor-pointer text-sm">
											{opportunityLabels[opp]}
										</Label>
									</div>
								))}
							</div>
						</div>
					</aside>

					{/* Mobile Filters */}
					<div className="flex items-center gap-4 lg:hidden">
						<Sheet>
							<SheetTrigger asChild>
								<Button variant="outline" size="sm">
									<FilterIcon className="mr-2 size-4" />
									Filtros
									{hasFilters && (
										<span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs">
											{[sport, level, country].filter(Boolean).length +
												opportunities.length}
										</span>
									)}
								</Button>
							</SheetTrigger>
							<SheetContent side="left">
								<SheetHeader>
									<SheetTitle>Filtros</SheetTitle>
									<SheetDescription>
										Filtra atletas por deporte, nivel y oportunidades
									</SheetDescription>
								</SheetHeader>
								<div className="mt-6 space-y-6">
									{/* Mobile Sport Filter */}
									<div className="space-y-2">
										<Label>Deporte</Label>
										<Select
											value={sport || "all"}
											onValueChange={(v) => {
												setSport(v === "all" ? null : v);
												setPage(1);
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Todos" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Todos</SelectItem>
												{AthleteSports.map((s) => (
													<SelectItem key={s} value={s}>
														{sportLabels[s]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Mobile Level Filter */}
									<div className="space-y-2">
										<Label>Nivel</Label>
										<Select
											value={level || "all"}
											onValueChange={(v) => {
												setLevel(v === "all" ? null : v);
												setPage(1);
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Todos" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Todos</SelectItem>
												{AthleteLevels.map((l) => (
													<SelectItem key={l} value={l}>
														{levelLabels[l]}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Mobile Opportunities Filter */}
									<div className="space-y-3">
										<Label>Buscando</Label>
										{AthleteOpportunityTypes.map((opp) => (
											<div key={opp} className="flex items-center space-x-2">
												<Checkbox
													id={`mobile-${opp}`}
													checked={opportunities.includes(opp)}
													onCheckedChange={() => handleOpportunityToggle(opp)}
												/>
												<Label
													htmlFor={`mobile-${opp}`}
													className="cursor-pointer text-sm"
												>
													{opportunityLabels[opp]}
												</Label>
											</div>
										))}
									</div>

									{hasFilters && (
										<Button
											variant="outline"
											onClick={clearFilters}
											className="w-full"
										>
											Limpiar filtros
										</Button>
									)}
								</div>
							</SheetContent>
						</Sheet>

						{hasFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="text-muted-foreground"
							>
								Limpiar
							</Button>
						)}
					</div>

					{/* Athletes Grid */}
					<div className="flex-1">
						{/* Results Header */}
						<div className="mb-6 flex items-center justify-between">
							<p className="text-muted-foreground text-sm">
								{data?.total ?? 0} atletas encontrados
							</p>
							{isFetching && !isLoading && (
								<Loader2Icon className="size-4 animate-spin text-muted-foreground" />
							)}
						</div>

						{/* Loading State */}
						{isLoading && (
							<div className="flex flex-col items-center justify-center py-16">
								<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
								<p className="mt-4 text-muted-foreground">
									Cargando atletas...
								</p>
							</div>
						)}

						{/* Empty State */}
						{!isLoading && data?.athletes.length === 0 && (
							<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
								<UsersIcon className="size-12 text-muted-foreground/50" />
								<h3 className="mt-4 font-semibold text-lg">
									No se encontraron atletas
								</h3>
								<p className="mt-2 text-muted-foreground text-sm">
									Intenta ajustar los filtros de busqueda
								</p>
								{hasFilters && (
									<Button
										variant="outline"
										onClick={clearFilters}
										className="mt-4"
									>
										Limpiar filtros
									</Button>
								)}
							</div>
						)}

						{/* Athletes Grid */}
						{!isLoading && data && data.athletes.length > 0 && (
							<>
								<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
									{data.athletes.map((athlete) => (
										<AthleteCard key={athlete.id} athlete={athlete} />
									))}
								</div>

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="mt-8 flex items-center justify-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage(Math.max(1, page - 1))}
											disabled={page <= 1}
										>
											Anterior
										</Button>
										<span className="px-4 text-muted-foreground text-sm">
											Pagina {page} de {totalPages}
										</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage(Math.min(totalPages, page + 1))}
											disabled={page >= totalPages}
										>
											Siguiente
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</section>
		</>
	);
}

export function AthletesSearchSection() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[50vh] items-center justify-center">
					<Loader2Icon className="size-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<AthletesSearchContent />
		</Suspense>
	);
}
