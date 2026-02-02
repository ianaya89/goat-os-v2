"use client";

import { Check, ChevronsUpDown, Loader2Icon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type InstitutionType = "club" | "nationalTeam";

interface InstitutionSelectorProps {
	type: InstitutionType;
	value: string | null | undefined;
	onChange: (value: string | null) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function InstitutionSelector({
	type,
	value,
	onChange,
	placeholder,
	disabled,
	className,
}: InstitutionSelectorProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: institutions, isLoading } =
		trpc.organization.institution.list.useQuery({
			type,
		});

	const selectedInstitution = institutions?.find((i) => i.id === value);

	const filteredInstitutions =
		institutions?.filter((institution) =>
			institution.name.toLowerCase().includes(searchQuery.toLowerCase()),
		) ?? [];

	const defaultPlaceholder =
		type === "club" ? "Seleccionar club..." : "Seleccionar seleccion...";

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled || isLoading}
					className={cn("w-full justify-between font-normal", className)}
				>
					{isLoading ? (
						<span className="flex items-center gap-2 text-muted-foreground">
							<Loader2Icon className="size-4 animate-spin" />
							Cargando...
						</span>
					) : selectedInstitution ? (
						<span className="flex items-center gap-2">
							<Avatar className="size-5">
								<AvatarImage src={selectedInstitution.logoUrl ?? undefined} />
								<AvatarFallback className="text-[10px]">
									{selectedInstitution.name.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="truncate">{selectedInstitution.name}</span>
						</span>
					) : (
						<span className="text-muted-foreground">
							{placeholder ?? defaultPlaceholder}
						</span>
					)}
					<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={`Buscar ${type === "club" ? "club" : "seleccion"}...`}
						value={searchQuery}
						onValueChange={setSearchQuery}
					/>
					<CommandList>
						<CommandEmpty>
							<div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
								<SearchIcon className="size-8" />
								<p className="text-sm">No se encontraron resultados</p>
							</div>
						</CommandEmpty>
						<CommandGroup>
							{/* Option to clear selection */}
							{value && (
								<CommandItem
									value=""
									onSelect={() => {
										onChange(null);
										setOpen(false);
									}}
									className="text-muted-foreground"
								>
									<span className="italic">Sin seleccionar</span>
								</CommandItem>
							)}
							{filteredInstitutions.map((institution) => (
								<CommandItem
									key={institution.id}
									value={institution.id}
									onSelect={() => {
										onChange(institution.id);
										setOpen(false);
									}}
								>
									<div className="flex items-center gap-2">
										<Avatar className="size-6">
											<AvatarImage src={institution.logoUrl ?? undefined} />
											<AvatarFallback className="text-[10px]">
												{institution.name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col">
											<span>{institution.name}</span>
											{institution.country && (
												<span className="text-muted-foreground text-xs">
													{institution.country}
													{institution.category && ` - ${institution.category}`}
												</span>
											)}
										</div>
									</div>
									<Check
										className={cn(
											"ml-auto size-4",
											value === institution.id ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
