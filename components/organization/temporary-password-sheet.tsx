"use client";

import type * as React from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

export interface TemporaryPasswordSheetProps {
	/**
	 * Whether the sheet is open.
	 */
	open: boolean;
	/**
	 * The temporary password to display.
	 */
	password: string;
	/**
	 * The type of entity created (e.g., "athlete", "coach").
	 */
	entityType: "athlete" | "coach" | "user";
	/**
	 * Callback when the sheet is closed.
	 */
	onClose: () => void;
	/**
	 * Optional callback for animation end capture.
	 */
	onAnimationEndCapture?: () => void;
}

const entityLabels = {
	athlete: {
		title: "Atleta Creado Exitosamente",
		description:
			"Comparte esta contraseña con el atleta. Deberá cambiarla después de su primer inicio de sesión.",
	},
	coach: {
		title: "Entrenador Creado Exitosamente",
		description:
			"Comparte esta contraseña con el entrenador. Deberá cambiarla después de su primer inicio de sesión.",
	},
	user: {
		title: "Usuario Creado Exitosamente",
		description:
			"Comparte esta contraseña con el usuario. Deberá cambiarla después de su primer inicio de sesión.",
	},
} as const;

/**
 * Reusable sheet component for displaying temporary passwords after user creation.
 * Shows the password with copy functionality and clear instructions.
 */
export function TemporaryPasswordSheet({
	open,
	password,
	entityType,
	onClose,
	onAnimationEndCapture,
}: TemporaryPasswordSheetProps): React.JSX.Element {
	const labels = entityLabels[entityType];

	const handleCopyPassword = async () => {
		if (password) {
			await navigator.clipboard.writeText(password);
			toast.success("Contraseña copiada al portapapeles");
		}
	};

	return (
		<Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<SheetContent
				className="sm:max-w-lg"
				onAnimationEndCapture={onAnimationEndCapture}
			>
				<SheetHeader>
					<SheetTitle>{labels.title}</SheetTitle>
					<SheetDescription>
						Por favor guarda la contraseña temporal. Solo se mostrará una vez.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-4 px-6 py-4">
					<Alert>
						<AlertTitle>Contraseña Temporal</AlertTitle>
						<AlertDescription className="mt-2">
							<code className="rounded bg-muted px-2 py-1 font-mono text-sm">
								{password}
							</code>
						</AlertDescription>
					</Alert>

					<p className="text-muted-foreground text-sm">{labels.description}</p>
				</div>

				<SheetFooter className="flex-row justify-end gap-2 border-t">
					<Button type="button" variant="outline" onClick={handleCopyPassword}>
						Copiar Contraseña
					</Button>
					<Button type="button" onClick={onClose}>
						Listo
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
