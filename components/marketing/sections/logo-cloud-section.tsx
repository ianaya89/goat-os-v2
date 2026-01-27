"use client";

import { cn } from "@/lib/utils";

// Custom SVG logos for sports organizations (these would be real logos in production)
const sportsLogos = [
	{ name: "FIFA", icon: "FIFA" },
	{ name: "CONMEBOL", icon: "CONMEBOL" },
	{ name: "AFA", icon: "AFA" },
	{ name: "Liga MX", icon: "LIGA MX" },
	{ name: "UEFA", icon: "UEFA" },
	{ name: "NBA", icon: "NBA" },
	{ name: "ATP", icon: "ATP" },
	{ name: "World Rugby", icon: "WR" },
];

function LogoPlaceholder({
	name: _name,
	icon,
}: {
	name: string;
	icon: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-center h-8 px-6",
				"text-marketing-fg-muted/50 font-bold text-sm tracking-wider",
				"transition-all duration-300",
				"hover:text-marketing-fg-muted",
			)}
		>
			{icon}
		</div>
	);
}

export function LogoCloudSection() {
	return (
		<section className="relative overflow-hidden border-y border-marketing-border/50 bg-marketing-card/30">
			<div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
				{/* Title */}
				<p className="text-center text-sm font-medium text-marketing-fg-muted mb-6">
					Utilizado por organizaciones deportivas de clase mundial
				</p>

				{/* Logos marquee */}
				<div className="relative">
					{/* Gradient masks */}
					<div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-marketing-bg to-transparent z-10 pointer-events-none" />
					<div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-marketing-bg to-transparent z-10 pointer-events-none" />

					{/* Scrolling container */}
					<div className="flex overflow-hidden">
						<div
							className="flex animate-marquee items-center gap-12"
							style={{ "--duration": "30s" } as React.CSSProperties}
						>
							{/* First set */}
							{sportsLogos.map((logo) => (
								<LogoPlaceholder
									key={logo.name}
									name={logo.name}
									icon={logo.icon}
								/>
							))}
							{/* Duplicate for seamless loop */}
							{sportsLogos.map((logo) => (
								<LogoPlaceholder
									key={`${logo.name}-dup`}
									name={logo.name}
									icon={logo.icon}
								/>
							))}
						</div>
					</div>
				</div>

				{/* Trust indicators - monochromatic with slate accent */}
				<div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-marketing-border/50">
					<div className="flex items-center gap-2 text-sm text-marketing-fg-muted">
						<svg
							viewBox="0 0 24 24"
							className="size-5 text-slate-500"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							<path d="M9 12l2 2 4-4" />
						</svg>
						<span>Seguridad empresarial</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-marketing-fg-muted">
						<svg
							viewBox="0 0 24 24"
							className="size-5 text-marketing-fg-muted"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 6v6l4 2" />
						</svg>
						<span>99.9% uptime garantizado</span>
					</div>
					<div className="flex items-center gap-2 text-sm text-marketing-fg-muted">
						<svg
							viewBox="0 0 24 24"
							className="size-5 text-marketing-fg-muted"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5" />
							<path d="M2 12l10 5 10-5" />
						</svg>
						<span>Integraciones ilimitadas</span>
					</div>
				</div>
			</div>
		</section>
	);
}
