"use client";

import { useLocale, useTranslations } from "next-intl";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_COOKIE_NAME, type Locale, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const localeConfig: Record<Locale, { name: string; flag: string }> = {
	es: { name: "Español", flag: "🇪🇸" },
	en: { name: "English", flag: "🇺🇸" },
};

interface LanguageSwitcherProps {
	variant?: "icon" | "full";
	className?: string;
}

export function LanguageSwitcher({
	variant = "icon",
	className,
}: LanguageSwitcherProps): React.JSX.Element {
	const t = useTranslations("common");
	const locale = useLocale() as Locale;

	const handleLocaleChange = (newLocale: Locale) => {
		// Set cookie
		document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
		// Full page reload to apply new locale
		window.location.reload();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size={variant === "icon" ? "icon" : "default"}
					aria-label={t("language.switch")}
					className={className}
				>
					{variant === "icon" ? (
						<span className="text-lg">{localeConfig[locale].flag}</span>
					) : (
						<>
							<span className="mr-2">{localeConfig[locale].flag}</span>
							<span>{localeConfig[locale].name}</span>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((loc) => (
					<DropdownMenuItem
						key={loc}
						onClick={() => handleLocaleChange(loc)}
						className={cn(
							"cursor-pointer",
							locale === loc && "bg-accent font-medium",
						)}
					>
						<span className="mr-2">{localeConfig[loc].flag}</span>
						{localeConfig[loc].name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
