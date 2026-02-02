"use client";

import { CameraIcon, ImageIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type CoverPhotoVariant = "athlete" | "coach";

interface CoverPhotoUploadProps {
	/**
	 * Which profile type this upload is for - determines which tRPC endpoints to use
	 */
	variant: CoverPhotoVariant;
	/**
	 * Initial cover photo URL (if already loaded)
	 */
	coverPhotoUrl?: string | null;
	/**
	 * Callback when image is updated
	 */
	onImageUpdated?: () => void;
	/**
	 * Whether the cover photo is editable
	 */
	editable?: boolean;
}

export function CoverPhotoUpload({
	variant,
	coverPhotoUrl: initialCoverUrl,
	onImageUpdated,
	editable = true,
}: CoverPhotoUploadProps) {
	const utils = trpc.useUtils();
	const [isUploading, setIsUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Fetch signed URL for cover photo based on variant
	const athleteCoverQuery = trpc.athlete.getCoverPhotoUrl.useQuery(undefined, {
		enabled: variant === "athlete" && !initialCoverUrl,
	});
	const coachCoverQuery = trpc.coach.getCoverPhotoUrl.useQuery(undefined, {
		enabled: variant === "coach" && !initialCoverUrl,
	});

	// Mutations based on variant
	const athleteUploadUrlMutation =
		trpc.athlete.getCoverPhotoUploadUrl.useMutation();
	const coachUploadUrlMutation =
		trpc.coach.getCoverPhotoUploadUrl.useMutation();

	const athleteSaveMutation = trpc.athlete.saveCoverPhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de portada actualizada");
			utils.athlete.getCoverPhotoUrl.invalidate();
			utils.athlete.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al guardar la foto de portada");
		},
	});

	const coachSaveMutation = trpc.coach.saveCoverPhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de portada actualizada");
			utils.coach.getCoverPhotoUrl.invalidate();
			utils.coach.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al guardar la foto de portada");
		},
	});

	const athleteRemoveMutation = trpc.athlete.removeCoverPhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de portada eliminada");
			setPreviewUrl(null);
			utils.athlete.getCoverPhotoUrl.invalidate();
			utils.athlete.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar la foto de portada");
		},
	});

	const coachRemoveMutation = trpc.coach.removeCoverPhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de portada eliminada");
			setPreviewUrl(null);
			utils.coach.getCoverPhotoUrl.invalidate();
			utils.coach.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar la foto de portada");
		},
	});

	// Select the appropriate data/functions based on variant
	const coverPhotoData =
		variant === "athlete" ? athleteCoverQuery.data : coachCoverQuery.data;

	const getUploadUrl =
		variant === "athlete"
			? athleteUploadUrlMutation.mutateAsync
			: coachUploadUrlMutation.mutateAsync;

	const saveCoverPhoto =
		variant === "athlete"
			? athleteSaveMutation.mutateAsync
			: coachSaveMutation.mutateAsync;

	const removeCoverPhoto =
		variant === "athlete"
			? athleteRemoveMutation.mutateAsync
			: coachRemoveMutation.mutateAsync;

	const isRemovePending =
		variant === "athlete"
			? athleteRemoveMutation.isPending
			: coachRemoveMutation.isPending;

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Por favor selecciona una imagen válida");
			return;
		}

		// Validate file size (max 10MB for cover photos)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("La imagen debe ser menor a 10MB");
			return;
		}

		// Show preview
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);

		setIsUploading(true);
		try {
			// Get upload URL
			const { uploadUrl, fileKey } = await getUploadUrl({
				fileName: file.name,
				contentType: file.type,
			});

			// Upload to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Error al subir la imagen");
			}

			// Save to database
			await saveCoverPhoto({ fileKey });
		} catch (_error) {
			toast.error("Error al subir la imagen");
			setPreviewUrl(null);
		} finally {
			setIsUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const handleRemoveCoverPhoto = async () => {
		await removeCoverPhoto();
	};

	// Use preview URL first, then passed URL, then query URL
	const displayUrl = previewUrl || initialCoverUrl || coverPhotoData?.signedUrl;
	const hasCoverPhoto =
		!!previewUrl || !!initialCoverUrl || coverPhotoData?.hasCoverPhoto;

	return (
		<div className="relative">
			{/* Cover photo container */}
			<div
				className={cn(
					"relative h-48 w-full overflow-hidden rounded-t-lg bg-gradient-to-r from-primary/20 to-primary/10",
					!displayUrl && "flex items-center justify-center",
				)}
			>
				{displayUrl ? (
					<img
						src={displayUrl}
						alt="Foto de portada"
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex flex-col items-center gap-2 text-muted-foreground">
						<ImageIcon className="size-12 opacity-50" />
						<span className="text-sm">Sin foto de portada</span>
					</div>
				)}

				{/* Loading overlay */}
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/50">
						<Loader2Icon className="size-10 animate-spin text-white" />
					</div>
				)}
			</div>

			{/* Edit controls */}
			{editable && (
				<div className="absolute right-4 top-4 flex gap-2">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={handleFileSelect}
					/>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
						className="bg-background/90 text-foreground shadow-md backdrop-blur-sm hover:bg-background"
					>
						<CameraIcon className="mr-2 size-4" />
						{hasCoverPhoto ? "Cambiar" : "Agregar foto"}
					</Button>

					{hasCoverPhoto && (
						<Button
							type="button"
							size="sm"
							variant="secondary"
							onClick={handleRemoveCoverPhoto}
							disabled={isUploading || isRemovePending}
							className="bg-background/90 text-destructive shadow-md backdrop-blur-sm hover:bg-background"
						>
							{isRemovePending ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<TrashIcon className="size-4" />
							)}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
