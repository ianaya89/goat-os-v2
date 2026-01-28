"use client";

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
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

type ServiceSelectorProps = {
	value: string | null | undefined;
	onValueChange: (value: string | null) => void;
	className?: string;
};

export function ServiceSelector({
	value,
	onValueChange,
	className,
}: ServiceSelectorProps): React.JSX.Element {
	const t = useTranslations("finance.services.selector");
	const [open, setOpen] = React.useState(false);

	const { data: services } = trpc.organization.service.listActive.useQuery();

	const selectedService = services?.find((s) => s.id === value);

	const formatPrice = (price: number, currency: string) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(price / 100);
	};

	return (
		<div className={cn("flex items-center gap-1", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between font-normal"
					>
						<span className="truncate">
							{selectedService ? selectedService.name : t("placeholder")}
						</span>
						<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0" align="start">
					<Command>
						<CommandInput placeholder={t("search")} />
						<CommandList>
							<CommandEmpty>{t("noResults")}</CommandEmpty>
							<CommandGroup>
								<CommandItem
									value="__none__"
									onSelect={() => {
										onValueChange(null);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											!value ? "opacity-100" : "opacity-0",
										)}
									/>
									<span className="text-muted-foreground">{t("none")}</span>
								</CommandItem>
								{services?.map((service) => (
									<CommandItem
										key={service.id}
										value={service.name}
										onSelect={() => {
											onValueChange(service.id);
											setOpen(false);
										}}
									>
										<CheckIcon
											className={cn(
												"mr-2 h-4 w-4",
												value === service.id ? "opacity-100" : "opacity-0",
											)}
										/>
										<div className="flex flex-1 items-center justify-between">
											<span>{service.name}</span>
											<span className="text-xs text-muted-foreground">
												{formatPrice(service.currentPrice, service.currency)}
											</span>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{value && (
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0"
					onClick={() => onValueChange(null)}
				>
					<XIcon className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}
