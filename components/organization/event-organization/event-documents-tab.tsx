"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Download,
	ExternalLink,
	File,
	FileText,
	Image,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
	Upload,
} from "lucide-react";
import * as React from "react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useZodForm } from "@/hooks/use-zod-form";
import type { EventDocumentType } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { createDocumentSchema } from "@/schemas/organization-event-organization-schemas";
import { trpc } from "@/trpc/client";

interface EventDocumentsTabProps {
	eventId: string;
}

const documentTypes = [
	{ value: "contract", label: "Contrato", icon: FileText },
	{ value: "permit", label: "Permiso", icon: FileText },
	{ value: "insurance", label: "Seguro", icon: FileText },
	{ value: "floor_plan", label: "Plano", icon: Image },
	{ value: "schedule", label: "Cronograma", icon: FileText },
	{ value: "budget", label: "Presupuesto", icon: FileText },
	{ value: "marketing", label: "Marketing", icon: Image },
	{ value: "other", label: "Otro", icon: File },
];

export function EventDocumentsTab({
	eventId,
}: EventDocumentsTabProps): React.JSX.Element {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [filterType, setFilterType] = React.useState<string | null>(null);

	const utils = trpc.useUtils();

	const { data, isPending } =
		trpc.organization.eventOrganization.listDocuments.useQuery({
			eventId,
			documentType: (filterType as EventDocumentType) ?? undefined,
		});

	const createMutation =
		trpc.organization.eventOrganization.createDocument.useMutation({
			onSuccess: () => {
				toast.success("Documento agregado");
				utils.organization.eventOrganization.listDocuments.invalidate();
				setIsDialogOpen(false);
				form.reset();
			},
			onError: (error) => {
				toast.error(error.message || "Error al agregar documento");
			},
		});

	const deleteMutation =
		trpc.organization.eventOrganization.deleteDocument.useMutation({
			onSuccess: () => {
				toast.success("Documento eliminado");
				utils.organization.eventOrganization.listDocuments.invalidate();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar documento");
			},
		});

	const form = useZodForm({
		schema: createDocumentSchema,
		defaultValues: {
			eventId,
			name: "",
			documentType: "other",
			storageKey: "",
			fileName: "",
			fileSize: undefined,
			mimeType: "",
		},
	});

	const onSubmit = form.handleSubmit((data) => {
		createMutation.mutate(data);
	});

	const getDocumentIcon = (type: string) => {
		const docType = documentTypes.find((d) => d.value === type);
		const IconComponent = docType?.icon ?? File;
		return <IconComponent className="size-5 text-muted-foreground" />;
	};

	const getDocumentTypeLabel = (type: string) => {
		return documentTypes.find((d) => d.value === type)?.label ?? type;
	};

	const formatFileSize = (bytes?: number | null) => {
		if (!bytes) return "";
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Documentos</CardTitle>
						<CardDescription>
							{data?.length ?? 0} documentos adjuntos
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Select
							value={filterType ?? "all"}
							onValueChange={(v) => setFilterType(v === "all" ? null : v)}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos</SelectItem>
								{documentTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button onClick={() => setIsDialogOpen(true)}>
							<Plus className="size-4 mr-1" />
							Agregar
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isPending ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-24 w-full" />
						))}
					</div>
				) : data?.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Upload className="size-12 mx-auto mb-2 opacity-50" />
						<p>No hay documentos adjuntos</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{data?.map((doc) => (
							<div
								key={doc.id}
								className="border rounded-lg p-4 hover:shadow-md transition-shadow"
							>
								<div className="flex items-start gap-3">
									<div className="size-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
										{getDocumentIcon(doc.documentType)}
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="font-medium truncate">{doc.name}</h3>
										<div className="flex items-center gap-2 mt-1">
											<Badge variant="secondary" className="text-xs">
												{getDocumentTypeLabel(doc.documentType)}
											</Badge>
											{doc.fileSize && (
												<span className="text-xs text-muted-foreground">
													{formatFileSize(doc.fileSize)}
												</span>
											)}
										</div>
										{doc.fileName && (
											<p className="text-xs text-muted-foreground mt-1 truncate">
												{doc.fileName}
											</p>
										)}
										<p className="text-xs text-muted-foreground mt-1">
											{format(new Date(doc.createdAt), "dd MMM yyyy", {
												locale: es,
											})}
										</p>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="size-8">
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{doc.storageKey && (
												<DropdownMenuItem asChild>
													<a
														href={doc.storageKey}
														target="_blank"
														rel="noopener noreferrer"
													>
														<ExternalLink className="size-4" />
														Abrir
													</a>
												</DropdownMenuItem>
											)}
											<DropdownMenuItem
												onClick={() => deleteMutation.mutate({ id: doc.id })}
												variant="destructive"
											>
												<Trash2 className="size-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Documento</DialogTitle>
						<DialogDescription>
							Agrega un documento o enlace al evento
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={onSubmit} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input
												placeholder="Ej: Contrato de alquiler"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="documentType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Documento</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{documentTypes.map((type) => (
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

							<FormField
								control={form.control}
								name="storageKey"
								render={({ field }) => (
									<FormItem>
										<FormLabel>URL del Archivo</FormLabel>
										<FormControl>
											<Input
												placeholder="https://..."
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="fileName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre del Archivo (opcional)</FormLabel>
										<FormControl>
											<Input
												placeholder="documento.pdf"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending && (
										<Loader2 className="mr-2 size-4 animate-spin" />
									)}
									Agregar
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</Card>
	);
}
