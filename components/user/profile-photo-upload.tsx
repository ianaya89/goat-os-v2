"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CameraIcon, Loader2Icon, UserIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { CropImageModal } from "@/components/crop-image-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

type ProfileVariant = "athlete" | "coach";

interface ProfilePhotoUploadProps {
	/**
	 * Which profile type this upload is for - determines which tRPC endpoints to use
	 */
	variant: ProfileVariant;
	/**
	 * User's display name for initials fallback
	 */
	userName: string;
	/**
	 * Current image URL (OAuth or direct URL)
	 */
	currentImageUrl?: string | null;
	/**
	 * Callback when image is updated
	 */
	onImageUpdated?: () => void;
	/**
	 * Size of the avatar
	 */
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
	sm: "size-16",
	md: "size-24",
	lg: "size-32",
	xl: "size-40",
};

export function ProfilePhotoUpload({
	variant,
	userName,
	currentImageUrl,
	onImageUpdated,
	size = "lg",
}: ProfilePhotoUploadProps) {
	const utils = trpc.useUtils();
	const [isUploading, setIsUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Use the appropriate queries/mutations based on variant
	const athletePhotoQuery = trpc.athlete.getProfilePhotoUrl.useQuery(
		undefined,
		{ enabled: variant === "athlete" },
	);
	const coachPhotoQuery = trpc.coach.getProfilePhotoUrl.useQuery(undefined, {
		enabled: variant === "coach",
	});

	const athleteUploadUrlMutation =
		trpc.athlete.getProfilePhotoUploadUrl.useMutation();
	const coachUploadUrlMutation =
		trpc.coach.getProfilePhotoUploadUrl.useMutation();

	const athleteSaveMutation = trpc.athlete.saveProfilePhoto.useMutation({
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

	const coachSaveMutation = trpc.coach.saveProfilePhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de perfil actualizada");
			utils.coach.getProfilePhotoUrl.invalidate();
			utils.coach.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al guardar la imagen");
		},
	});

	const athleteRemoveMutation = trpc.athlete.removeProfilePhoto.useMutation({
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

	const coachRemoveMutation = trpc.coach.removeProfilePhoto.useMutation({
		onSuccess: () => {
			toast.success("Foto de perfil eliminada");
			setPreviewUrl(null);
			utils.coach.getProfilePhotoUrl.invalidate();
			utils.coach.getMyProfile.invalidate();
			onImageUpdated?.();
		},
		onError: (error) => {
			toast.error(error.message || "Error al eliminar la imagen");
		},
	});

	// Select the appropriate data based on variant
	const profilePhotoData =
		variant === "athlete" ? athletePhotoQuery.data : coachPhotoQuery.data;

	const getUploadUrl =
		variant === "athlete"
			? athleteUploadUrlMutation.mutateAsync
			: coachUploadUrlMutation.mutateAsync;

	const saveImage =
		variant === "athlete"
			? athleteSaveMutation.mutateAsync
			: coachSaveMutation.mutateAsync;

	const removeImage =
		variant === "athlete"
			? athleteRemoveMutation.mutateAsync
			: coachRemoveMutation.mutateAsync;

	const isRemovePending =
		variant === "athlete"
			? athleteRemoveMutation.isPending
			: coachRemoveMutation.isPending;

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
						const { uploadUrl, imageKey } = await getUploadUrl({
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
						await saveImage({ imageKey });
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
		await removeImage();
	};

	// Use preview URL first, then S3 signed URL, then OAuth/fallback URL
	const displayUrl =
		previewUrl || profilePhotoData?.signedUrl || currentImageUrl;
	const hasS3Image = profilePhotoData?.source === "s3" || !!previewUrl;

	const initials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="group/avatar relative" {...getRootProps()}>
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

			{/* Upload button overlay - bottom right */}
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

			{/* Remove button overlay - top left, visible on hover */}
			{hasS3Image && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						handleRemoveImage();
					}}
					disabled={isUploading || isRemovePending}
					className={cn(
						"absolute top-0 left-0 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 transition-all hover:scale-110 group-hover/avatar:opacity-100 disabled:pointer-events-none",
						size === "sm" ? "size-5" : size === "md" ? "size-6" : "size-7",
					)}
				>
					{isRemovePending ? (
						<Loader2Icon className="size-3 animate-spin" />
					) : (
						<XIcon className={size === "sm" ? "size-3" : "size-3.5"} />
					)}
				</button>
			)}
		</div>
	);
}
