"use client";

import { UserPlus } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 10 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.3,
			ease: "easeOut" as const,
		},
	},
};

export function RestrictedSignUpCard(): React.JSX.Element {
	return (
		<Card className="w-full border-0 bg-white/70 px-6 py-8 shadow-2xl shadow-primary/10 backdrop-blur-md dark:bg-card/70 dark:shadow-primary/5">
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<CardHeader>
					<motion.div variants={itemVariants}>
						<CardTitle className="text-base lg:text-lg">
							Registro Restringido
						</CardTitle>
						<CardDescription className="mt-1">
							El registro general está disponible solo por invitación.
						</CardDescription>
					</motion.div>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<motion.p
						className="text-muted-foreground text-sm"
						variants={itemVariants}
					>
						Si eres un <strong className="text-foreground">atleta</strong>,
						puedes registrarte directamente:
					</motion.p>
					<motion.div variants={itemVariants}>
						<Button
							asChild
							className="w-full transition-transform duration-200 active:scale-[0.98]"
						>
							<Link href="/athlete-signup">
								<UserPlus className="mr-2 size-4" />
								Registrarme como Atleta
							</Link>
						</Button>
					</motion.div>
					<motion.p
						className="text-muted-foreground text-sm"
						variants={itemVariants}
					>
						Para otros tipos de cuenta, contacta al administrador de tu
						organización para recibir una invitación.
					</motion.p>
				</CardContent>
				<CardFooter className="flex justify-center gap-1 text-muted-foreground text-sm">
					<motion.span variants={itemVariants}>
						¿Ya tienes una cuenta?{" "}
						<Link
							className="text-foreground underline transition-colors hover:text-primary"
							href="/auth/sign-in"
						>
							Iniciar sesión
						</Link>
					</motion.span>
				</CardFooter>
			</motion.div>
		</Card>
	);
}
