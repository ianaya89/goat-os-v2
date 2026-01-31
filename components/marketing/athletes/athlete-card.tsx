import { differenceInYears } from "date-fns";
import { MapPinIcon, SparklesIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user/user-avatar";
import type { AthleteOpportunityType } from "@/lib/db/schema/enums";
import { capitalize } from "@/lib/utils";

const levelColors: Record<string, string> = {
	beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
	intermediate:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
	advanced:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
	elite: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm",
};

const opportunityLabels: Record<AthleteOpportunityType, string> = {
	professional_team: "Buscando equipo",
	university_scholarship: "Buscando universidad",
	tryouts: "Abierto a pruebas",
	sponsorship: "Buscando sponsor",
	coaching: "Abierto a coaching",
};

interface AthleteCardProps {
	athlete: {
		id: string;
		sport: string;
		level: string;
		position: string | null;
		nationality: string | null;
		residenceCountry: string | null;
		birthDate: Date | null;
		yearsOfExperience: number | null;
		currentClub: { id: string; name: string } | null;
		opportunityTypes: AthleteOpportunityType[] | null;
		user: {
			name: string;
			image: string | null;
		} | null;
	};
}

export function AthleteCard({ athlete }: AthleteCardProps) {
	const age = athlete.birthDate
		? differenceInYears(new Date(), new Date(athlete.birthDate))
		: null;

	const hasOpportunities =
		athlete.opportunityTypes && athlete.opportunityTypes.length > 0;

	return (
		<Link
			href={`/athlete/${athlete.id}`}
			className="group relative flex flex-col gap-4 rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
		>
			{/* Opportunity Badge */}
			{hasOpportunities && (
				<div className="absolute top-3 right-3">
					<Badge className="bg-green-500 text-white">
						<SparklesIcon className="mr-1 size-3" />
						Open
					</Badge>
				</div>
			)}

			{/* Avatar and Name */}
			<div className="flex items-center gap-4">
				<UserAvatar
					className="size-16 border-2 border-muted"
					name={athlete.user?.name ?? "Atleta"}
					src={athlete.user?.image ?? undefined}
				/>
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-semibold text-lg group-hover:text-primary">
						{athlete.user?.name ?? "Atleta"}
					</h3>
					<p className="text-muted-foreground text-sm">
						{capitalize(athlete.sport.replace("_", " "))}
						{athlete.position && ` - ${athlete.position}`}
					</p>
				</div>
			</div>

			{/* Info Row */}
			<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
				{age && <span className="flex items-center gap-1">{age} anos</span>}
				{(athlete.residenceCountry || athlete.nationality) && (
					<span className="flex items-center gap-1">
						<MapPinIcon className="size-3.5" />
						{athlete.residenceCountry || athlete.nationality}
					</span>
				)}
				{athlete.yearsOfExperience && (
					<span className="flex items-center gap-1">
						<TrophyIcon className="size-3.5" />
						{athlete.yearsOfExperience} anos exp.
					</span>
				)}
			</div>

			{/* Current Club */}
			{athlete.currentClub && (
				<p className="truncate text-muted-foreground text-sm">
					{athlete.currentClub.name}
				</p>
			)}

			{/* Level Badge */}
			<div className="flex flex-wrap items-center gap-2">
				<Badge className={levelColors[athlete.level] ?? "bg-muted"}>
					{capitalize(athlete.level)}
				</Badge>
			</div>

			{/* Opportunity Types */}
			{hasOpportunities && (
				<div className="flex flex-wrap gap-1.5 border-t pt-4">
					{athlete.opportunityTypes!.slice(0, 2).map((opp) => (
						<Badge
							key={opp}
							variant="outline"
							className="border-green-500/30 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
						>
							{opportunityLabels[opp]}
						</Badge>
					))}
					{athlete.opportunityTypes!.length > 2 && (
						<Badge variant="outline" className="text-muted-foreground">
							+{athlete.opportunityTypes!.length - 2}
						</Badge>
					)}
				</div>
			)}
		</Link>
	);
}
