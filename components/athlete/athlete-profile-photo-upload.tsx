"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CameraIcon, Loader2Icon, TrashIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { CropImageModal } from "@/components/crop-image-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface AthleteProfilePhotoUploadProps {
	userName: string;
	currentImageUrl?: string | null;
	onImageUpdated?: () => void;
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
	sm: "size-16",
	md: "size-24",
	lg: "size-32",
	xl: "size-40",
};

export function AthleteProfilePhotoUpload({
	userName,
	currentImageUrl,
	onImageUpdated,
	size = "lg",
}: AthleteProfilePhotoUploadProps) {
	const utils = trpc.useUtils();
	const [isUploading, setIsUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Fetch signed URL for S3 images
	const profilePhotoQuery = trpc.athlete.getProfilePhotoUrl.useQuery();

	const getUploadUrlMutation =
		trpc.athlete.getProfilePhotoUploadUrl.useMutation();
	const saveImageMutation = trpc.athlete.saveProfilePhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de perfil actualizada");
			utils.athlete.getProfilePhotoUrl.invalidate();
			utils.athlete.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al guardar la imagen");
		},
	});

	const removeImageMutation = trpc.athlete.removeProfilePhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de perfil eliminada");
			setPreviewUrl(null);
			utils.athlete.getProfilePhotoUrl.invalidate();
			utils.athlete.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar la imagen");
		},
	});

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) return;

			// Show crop modal
			NiceModal.show(CropImageModal, {
				image: file,
				onCrop: async (croppedImageData: Blob | null) => {
					if (!croppedImageData) return;

					// Show preview immediately
					const objectUrl = URL.createObjectURL(croppedImageData);
					setPreviewUrl(objectUrl);

					setIsUploading(true);
					try {
						// Get upload URL
						const { uploadUrl, imageKey } =
							await getUploadUrlMutation.mutateAsync({
								fileName: `${Date.now()}.png`,
								contentType: "image/png",
							});

						// Upload cropped image to S3
						const uploadResponse = await fetch(uploadUrl, {
							method: "PUT",
							body: croppedImageData,
							headers: {
								"Content-Type": "image/png",
							},
						});

						if (!uploadResponse.ok) {
							throw new Error("Error al subir la imagen");
						}

						// Save to database
						await saveImageMutation.mutateAsync({ imageKey });
					} catch (_error) {
						toast.error("Error al subir la imagen");
						setPreviewUrl(null);
					} finally {
						setIsUploading(false);
					}
				},
			});
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/webp": [".webp"],
		},
		multiple: false,
		disabled: isUploading,
	});

	const handleRemoveImage = async () => {
		await removeImageMutation.mutateAsync();
	};

	// Use preview URL first, then S3 signed URL, then OAuth/fallback URL
	const displayUrl =
		previewUrl || profilePhotoQuery.data?.signedUrl || currentImageUrl;
	const hasS3Image = profilePhotoQuery.data?.source === "s3" || !!previewUrl;

	const initials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="group relative" {...getRootProps()}>
			<input {...getInputProps()} />
			<Avatar
				className={cn(
					sizeClasses[size],
					"cursor-pointer border-4 border-background shadow-lg transition-opacity hover:opacity-80",
				)}
			>
				<AvatarImage src={displayUrl ?? undefined} alt={userName} />
				<AvatarFallback className="bg-primary/10 text-2xl font-semibold">
					{initials || <UserIcon className="size-1/2" />}
				</AvatarFallback>
			</Avatar>

			{isUploading && (
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
					<Loader2Icon className="size-8 animate-spin text-white" />
				</div>
			)}

			{/* Upload button overlay */}
			<button
				type="button"
				disabled={isUploading}
				className={cn(
					"absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110",
					size === "sm" ? "size-6" : size === "md" ? "size-8" : "size-10",
				)}
			>
				<CameraIcon
					className={
						size === "sm" ? "size-3" : size === "md" ? "size-4" : "size-5"
					}
				/>
			</button>

			{/* Remove button - show on hover only if there's an S3 image */}
			{hasS3Image && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleRemoveImage();
					}}
					disabled={isUploading || removeImageMutation.isPending}
					className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-1 text-destructive-foreground text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100 disabled:opacity-50"
				>
					{removeImageMutation.isPending ? (
						<Loader2Icon className="size-3 animate-spin" />
					) : (
						<TrashIcon className="size-3" />
					)}
					Eliminar
				</button>
			)}
		</div>
	);
}
