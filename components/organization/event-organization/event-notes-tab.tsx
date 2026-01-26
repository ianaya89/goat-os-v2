"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
	Loader2,
	MessageSquare,
	MoreHorizontal,
	Pin,
	Send,
	Trash2,
	User,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/lib/utils";
import { createNoteSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventNotesTabProps {
	eventId: string;
}

const noteTypes = [
	{
		value: "comment",
		label: "Comentario",
		color: "bg-slate-100 text-slate-700",
	},
	{
		value: "update",
		label: "Actualización",
		color: "bg-blue-100 text-blue-700",
	},
	{ value: "issue", label: "Problema", color: "bg-red-100 text-red-700" },
	{
		value: "decision",
		label: "Decisión",
		color: "bg-green-100 text-green-700",
	},
	{
		value: "reminder",
		label: "Recordatorio",
		color: "bg-yellow-100 text-yellow-700",
	},
];

export function EventNotesTab({
	eventId,
}: EventNotesTabProps): React.JSX.Element {
	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listNotes.useQuery({ eventId });

	const createMutation =
		trpc.organization.eventOrganization.createNote.useMutation({
			onSuccess: () => {
				toast.success("Nota agregada");
				utils.organization.eventOrganization.listNotes.invalidate();
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al crear nota");
			},
		});

	const pinMutation = trpc.organization.eventOrganization.pinNote.useMutation({
		onSuccess: () => {
			utils.organization.eventOrganization.listNotes.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Error al actualizar nota");
		},
	});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteNote.useMutation({
			onSuccess: () => {
				toast.success("Nota eliminada");
				utils.organization.eventOrganization.listNotes.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar nota");
			},
		});

	const form = useZodForm({
		schema: createNoteSchema,
		defaultValues: {
			eventId,
			content: "",
			noteType: "comment",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getTypeBadge = (type: string) => {
		const t = noteTypes.find((t) => t.value === type);
		return t ? (
			<Badge variant="outline" className={cn("text-xs", t.color)}>
				{t.label}
			</Badge>
		) : null;
	};

	const pinnedNotes = data?.filter((n) => n.isPinned) ?? [];
	const regularNotes = data?.filter((n) => !n.isPinned) ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Notas y Comentarios</CardTitle>
				<CardDescription>
					Activity log del evento - {data?.length ?? 0} notas
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* New Note Form */}
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-3">
						<div className="flex gap-2">
							<FormField
								control={form.control}
								name="noteType"
								render={({ field }) => (
									<FormItem>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger className="w-[140px]">
													<SelectValue placeholder="Tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{noteTypes.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex gap-2">
							<FormField
								control={form.control}
								name="content"
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormControl>
											<Textarea
												placeholder="Escribe una nota..."
												className="resize-none"
												rows={2}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								size="icon"
								className="h-[68px]"
								disabled={createMutation.isPending}
							>
								{createMutation.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Send className="size-4" />
								)}
							</Button>
						</div>
					</form>
				</Form>

				{/* Notes List */}
				{isPending ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						No hay notas todavía
					</div>
				) : (
					<div className="space-y-4">
						{/* Pinned Notes */}
						{pinnedNotes.length > 0 && (
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
									<Pin className="size-3" />
									Fijados
								</p>
								{pinnedNotes.map((note) => (
									<NoteCard
										key={note.id}
										note={note}
										onPin={() =>
											pinMutation.mutate({ id: note.id, pinned: false })
										}
										onDelete={() => deleteMutation.mutate({ id: note.id })}
										getTypeBadge={getTypeBadge}
									/>
								))}
							</div>
						)}

						{/* Regular Notes */}
						{regularNotes.length > 0 && (
							<div className="space-y-2">
								{pinnedNotes.length > 0 && (
									<p className="text-xs text-muted-foreground font-medium">
										Recientes
									</p>
								)}
								{regularNotes.map((note) => (
									<NoteCard
										key={note.id}
										note={note}
										onPin={() =>
											pinMutation.mutate({ id: note.id, pinned: true })
										}
										onDelete={() => deleteMutation.mutate({ id: note.id })}
										getTypeBadge={getTypeBadge}
									/>
								))}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface NoteCardProps {
	note: {
		id: string;
		content: string;
		noteType: string;
		isPinned: boolean;
		createdAt: Date;
		author?: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
	onPin: () => void;
	onDelete: () => void;
	getTypeBadge: (type: string) => React.ReactNode;
}

function NoteCard({ note, onPin, onDelete, getTypeBadge }: NoteCardProps) {
	return (
		<div
			className={cn(
				"border rounded-lg p-4",
				note.isPinned && "bg-muted/50 border-primary/20",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3 flex-1">
					<div className="size-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
						<User className="size-4 text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="font-medium text-sm">
								{note.author?.name ?? "Usuario"}
							</span>
							{getTypeBadge(note.noteType)}
							{note.isPinned && <Pin className="size-3 text-primary" />}
						</div>
						<p className="text-sm mt-1 whitespace-pre-wrap">{note.content}</p>
						<p className="text-xs text-muted-foreground mt-2">
							{formatDistanceToNow(new Date(note.createdAt), {
								addSuffix: true,
								locale: es,
							})}
						</p>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="size-8">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onPin}>
							<Pin className="size-4" />
							{note.isPinned ? "Desfijar" : "Fijar"}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onDelete} variant="destructive">
							<Trash2 className="size-4" />
							Eliminar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
