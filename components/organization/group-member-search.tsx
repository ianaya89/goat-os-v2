"use client";

import { differenceInYears } from "date-fns";
import { CheckIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { LevelBadge } from "@/components/ui/level-badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export interface GroupMemberSearchProps {
	selectedAthleteIds: string[];
	onToggleAthlete: (athlete: {
		id: string;
		user: { name: string; image: string | null } | null;
		birthDate?: Date | null;
		level?: string;
	}) => void;
	className?: string;
	triggerClassName?: string;
}

export function GroupMemberSearch({
	selectedAthleteIds,
	onToggleAthlete,
	className,
	triggerClassName,
}: GroupMemberSearchProps) {
	const t = useTranslations("athletes.groups");

	const [popoverOpen, setPopoverOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedQuery, setDebouncedQuery] = React.useState("");
	const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Debounce search query
	React.useEffect(() => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 300);

		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, [searchQuery]);

	// Only search when there's a query with at least 2 characters
	const shouldSearch = debouncedQuery.length >= 2;

	const { data: searchResults, isFetching: isSearching } =
		trpc.organization.athlete.list.useQuery(
			{
				limit: 20,
				offset: 0,
				query: debouncedQuery,
			},
			{
				enabled: shouldSearch,
				staleTime: 10000,
			},
		);

	const athletes = searchResults?.athletes ?? [];

	const calculateAge = (birthDate: Date | null): number | null => {
		if (!birthDate) return null;
		return differenceInYears(new Date(), new Date(birthDate));
	};

	return (
		<div className={className}>
			<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className={cn(
							"flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
							triggerClassName,
						)}
					>
						<SearchIcon className="size-4 text-muted-foreground" />
						<span className="text-muted-foreground">
							{t("modal.searchAthletes")}
						</span>
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-[350px] p-0" align="start">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={t("modal.searchAthletes")}
							value={searchQuery}
							onValueChange={setSearchQuery}
						/>
						<CommandList>
							{!shouldSearch && (
								<div className="py-6 text-center text-sm text-muted-foreground">
									{t("modal.typeToSearch")}
								</div>
							)}
							{shouldSearch && isSearching && (
								<div className="flex items-center justify-center py-6">
									<Loader2Icon className="size-5 animate-spin text-muted-foreground" />
								</div>
							)}
							{shouldSearch && !isSearching && athletes.length === 0 && (
								<CommandEmpty>{t("modal.noAthletesFound")}</CommandEmpty>
							)}
							{shouldSearch && !isSearching && athletes.length > 0 && (
								<CommandGroup>
									{athletes.map((athlete) => {
										const isSelected = selectedAthleteIds.includes(athlete.id);
										const age = calculateAge(athlete.birthDate);
										return (
											<CommandItem
												key={athlete.id}
												value={athlete.id}
												onSelect={() => onToggleAthlete(athlete)}
											>
												<div className="flex w-full items-center gap-2">
													<div
														className={cn(
															"flex size-4 shrink-0 items-center justify-center rounded-sm border",
															isSelected
																? "border-primary bg-primary text-primary-foreground"
																: "border-muted-foreground",
														)}
													>
														{isSelected && <CheckIcon className="size-3" />}
													</div>
													<UserAvatar
														className="size-7 shrink-0"
														name={athlete.user?.name ?? ""}
														src={athlete.user?.image ?? undefined}
													/>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className="truncate font-medium">
																{athlete.user?.name ?? "Unknown"}
															</span>
															{age !== null && (
																<span className="text-muted-foreground text-xs">
																	{age} años
																</span>
															)}
														</div>
													</div>
													{athlete.level && (
														<LevelBadge
															level={athlete.level}
															className="shrink-0"
														/>
													)}
												</div>
											</CommandItem>
										);
									})}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
