"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/ui/custom/theme-toggle";

interface Feature {
	icon: LucideIcon;
	title: string;
	description: string;
}

interface AuthSplitLayoutProps {
	children: React.ReactNode;
	title: string;
	subtitle: string;
	features: Feature[];
	footerText?: string;
}

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: {
		opacity: 1,
		x: 0,
		transition: {
			duration: 0.5,
			ease: "easeOut" as const,
		},
	},
};

const featureVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: 0.4 + i * 0.1,
			duration: 0.4,
			ease: "easeOut" as const,
		},
	}),
};

export function AuthSplitLayout({
	children,
	title,
	subtitle,
	features,
	footerText,
}: AuthSplitLayoutProps): React.JSX.Element {
	return (
		<div className="flex min-h-screen">
			{/* Left Panel - Branding */}
			<div className="relative hidden w-1/2 overflow-hidden bg-primary lg:block">
				{/* Animated gradient background */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />

				{/* Animated orbs */}
				<motion.div
					className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl"
					animate={{
						x: [0, 30, 0],
						y: [0, 20, 0],
						scale: [1, 1.1, 1],
					}}
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				<motion.div
					className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl"
					animate={{
						x: [0, -20, 0],
						y: [0, 30, 0],
						scale: [1, 1.15, 1],
					}}
					transition={{
						duration: 10,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 1,
					}}
				/>
				<motion.div
					className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl"
					animate={{
						x: [0, 25, 0],
						y: [0, -15, 0],
						scale: [1, 1.2, 1],
					}}
					transition={{
						duration: 12,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 2,
					}}
				/>

				{/* Grid pattern overlay */}
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

				{/* Floating dots */}
				<motion.div
					className="absolute left-[15%] top-[25%] h-2 w-2 rounded-full bg-white/20"
					animate={{
						y: [0, -15, 0],
						opacity: [0.2, 0.5, 0.2],
					}}
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				<motion.div
					className="absolute right-[20%] top-[40%] h-1.5 w-1.5 rounded-full bg-white/25"
					animate={{
						y: [0, -12, 0],
						opacity: [0.3, 0.6, 0.3],
					}}
					transition={{
						duration: 3.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 0.5,
					}}
				/>
				<motion.div
					className="absolute bottom-[35%] left-[25%] h-2.5 w-2.5 rounded-full bg-white/15"
					animate={{
						y: [0, -20, 0],
						opacity: [0.15, 0.4, 0.15],
					}}
					transition={{
						duration: 5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 1,
					}}
				/>

				{/* Content */}
				<motion.div
					className="relative flex h-full flex-col justify-between p-10 text-primary-foreground"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					<motion.div variants={itemVariants}>
						<Link
							href="/"
							className="inline-block transition-transform duration-300 hover:scale-105"
						>
							<Logo className="text-primary-foreground" size="lg" />
						</Link>
					</motion.div>

					<div className="max-w-md space-y-8">
						<motion.div className="space-y-4" variants={itemVariants}>
							<h1 className="font-bold text-3xl leading-tight tracking-tight">
								{title}
							</h1>
							<p className="text-primary-foreground/80 text-lg">{subtitle}</p>
						</motion.div>

						<div className="space-y-4">
							{features.map((feature, index) => (
								<motion.div
									key={feature.title}
									className="flex items-start gap-3"
									custom={index}
									variants={featureVariants}
									initial="hidden"
									animate="visible"
								>
									<motion.div
										className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm"
										whileHover={{
											scale: 1.1,
											backgroundColor: "rgba(255,255,255,0.2)",
										}}
										transition={{ duration: 0.2 }}
									>
										<feature.icon className="size-4" />
									</motion.div>
									<div>
										<p className="font-medium text-sm">{feature.title}</p>
										<p className="text-primary-foreground/70 text-sm">
											{feature.description}
										</p>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					<motion.p
						className="text-primary-foreground/50 text-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 1, duration: 0.5 }}
					>
						{footerText ||
							`© ${new Date().getFullYear()} GOAT OS. Todos los derechos reservados.`}
					</motion.p>
				</motion.div>
			</div>

			{/* Right Panel - Form */}
			<div className="relative flex w-full flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 lg:w-1/2">
				{/* Background effects for right panel */}
				<div className="pointer-events-none absolute inset-0 overflow-hidden">
					<motion.div
						className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
						animate={{
							x: [0, 20, 0],
							y: [0, 15, 0],
							scale: [1, 1.1, 1],
						}}
						transition={{
							duration: 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
					/>
					<motion.div
						className="absolute -bottom-32 -left-32 h-56 w-56 rounded-full bg-blue-400/5 blur-3xl dark:bg-blue-500/10"
						animate={{
							x: [0, -15, 0],
							y: [0, -20, 0],
							scale: [1, 1.15, 1],
						}}
						transition={{
							duration: 12,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
							delay: 1,
						}}
					/>
					{/* Subtle grid */}
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#00237c05_1px,transparent_1px),linear-gradient(to_bottom,#00237c05_1px,transparent_1px)] bg-[size:3rem_3rem] dark:bg-[linear-gradient(to_right,#5b7ec910_1px,transparent_1px),linear_gradient(to_bottom,#5b7ec910_1px,transparent_1px)]" />
				</div>

				{/* Mobile header */}
				<motion.div
					className="relative z-10 flex items-center justify-between border-b bg-white/50 p-4 backdrop-blur-sm dark:bg-card/50 lg:hidden"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<Link
						href="/"
						className="transition-transform duration-300 hover:scale-105"
					>
						<Logo />
					</Link>
				</motion.div>

				{/* Form container */}
				<div className="relative z-10 flex flex-1 items-center justify-center p-6">
					<motion.div
						className="w-full max-w-md"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{children}
					</motion.div>
				</div>
			</div>

			<ThemeToggle className="fixed right-4 bottom-4 z-50 rounded-full backdrop-blur-sm" />
		</div>
	);
}
