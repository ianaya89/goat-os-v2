"use client";

import NiceModal from "@ebay/nice-modal-react";
import { CameraIcon, Loader2Icon, UserIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CropImageModal } from "@/components/crop-image-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

interface ProfileImageUploadProps {
	userId: string;
	userName: string;
	currentImageUrl?: string | null; // OAuth image or fallback
	hasS3Image?: boolean;
	size?: "sm" | "md" | "lg" | "xl";
	onImageUpdated?: () => void;
}

const sizeClasses = {
	sm: "size-16",
	md: "size-24",
	lg: "size-32",
	xl: "size-40",
};

export function ProfileImageUpload({
	userId,
	userName,
	currentImageUrl,
	hasS3Image,
	size = "lg",
	onImageUpdated,
}: ProfileImageUploadProps) {
	const utils = trpc.useUtils();
	const [isUploading, setIsUploading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Fetch signed URL for S3 images
	const profileImageQuery = trpc.organization.user.getProfileImageUrl.useQuery(
		{ userId },
		{ enabled: hasS3Image },
	);

	const getUploadUrlMutation =
		trpc.organization.user.getProfileImageUploadUrl.useMutation();
	const saveImageMutation = trpc.organization.user.saveProfileImage.useMutation(
		{
			onSuccess: () => {
				toast.success("Foto de perfil actualizada");
				utils.organization.user.getProfileImageUrl.invalidate({ userId });
				utils.organization.user.list.invalidate();
				utils.organization.user.get.invalidate({ userId });
				utils.organization.athlete.getProfile.invalidate();
				utils.organization.athlete.list.invalidate();
				utils.organization.coach.list.invalidate();
				utils.organization.coach.getProfile.invalidate();
				onImageUpdated?.();
			},
			onError: (error) => {
				toast.error(error.message || "Error al guardar la imagen");
			},
		},
	);

	const removeImageMutation =
		trpc.organization.user.removeProfileImage.useMutation({
			onSuccess: () => {
				toast.success("Foto de perfil eliminada");
				setPreviewUrl(null);
				utils.organization.user.getProfileImageUrl.invalidate({ userId });
				utils.organization.user.list.invalidate();
				utils.organization.user.get.invalidate({ userId });
				utils.organization.athlete.getProfile.invalidate();
				utils.organization.athlete.list.invalidate();
				utils.organization.coach.list.invalidate();
				utils.organization.coach.getProfile.invalidate();
				onImageUpdated?.();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar la imagen");
			},
		});

	const uploadImage = async (blob: Blob, fileName: string) => {
		setIsUploading(true);
		try {
			// Show preview
			const objectUrl = URL.createObjectURL(blob);
			setPreviewUrl(objectUrl);

			// Get upload URL
			const { uploadUrl, imageKey } = await getUploadUrlMutation.mutateAsync({
				userId,
				fileName,
				contentType: blob.type || "image/png",
			});

			// Upload to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: blob,
				headers: {
					"Content-Type": blob.type || "image/png",
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Error al subir la imagen");
			}

			// Save to database
			await saveImageMutation.mutateAsync({
				userId,
				imageKey,
			});
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

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("La imagen debe ser menor a 5MB");
			return;
		}

		// Reset input so the same file can be selected again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}

		// Open crop modal
		NiceModal.show(CropImageModal, {
			image: file,
			onCrop: (croppedBlob: Blob | null) => {
				if (!croppedBlob) return;
				uploadImage(croppedBlob, file.name);
			},
		});
	};

	const handleRemoveImage = async () => {
		await removeImageMutation.mutateAsync({ userId });
	};

	// Use preview URL first, then S3 signed URL, then OAuth/fallback URL
	const displayUrl =
		previewUrl || profileImageQuery.data?.imageUrl || currentImageUrl;
	const initials = userName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const hasImage =
		hasS3Image || profileImageQuery.data?.source === "s3" || previewUrl;

	return (
		<div className="group/avatar relative">
			<Avatar
				className={cn(
					sizeClasses[size],
					"border-4 border-background shadow-lg",
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
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				className="hidden"
				onChange={handleFileSelect}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
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
			{hasImage && (
				<button
					type="button"
					onClick={handleRemoveImage}
					disabled={isUploading || removeImageMutation.isPending}
					className={cn(
						"absolute top-0 left-0 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md opacity-0 transition-all hover:scale-110 group-hover/avatar:opacity-100 disabled:pointer-events-none",
						size === "sm" ? "size-5" : size === "md" ? "size-6" : "size-7",
					)}
				>
					{removeImageMutation.isPending ? (
						<Loader2Icon className="size-3 animate-spin" />
					) : (
						<XIcon className={size === "sm" ? "size-3" : "size-3.5"} />
					)}
				</button>
			)}
		</div>
	);
}
