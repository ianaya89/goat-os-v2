"use client";

import { CameraIcon, Loader2Icon, TrashIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
				onImageUpdated?.();
			},
			onError: (error) => {
				toast.error(error.message || "Error al eliminar la imagen");
			},
		});

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

		// Show preview
		const objectUrl = URL.createObjectURL(file);
		setPreviewUrl(objectUrl);

		setIsUploading(true);
		try {
			// Get upload URL
			const { uploadUrl, imageKey } = await getUploadUrlMutation.mutateAsync({
				userId,
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

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative">
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

				{/* Upload button overlay */}
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
			</div>

			{/* Remove button - show only if there's an S3 image or preview */}
			{(hasS3Image ||
				profileImageQuery.data?.source === "s3" ||
				previewUrl) && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleRemoveImage}
					disabled={isUploading || removeImageMutation.isPending}
					className="text-muted-foreground hover:text-destructive"
				>
					{removeImageMutation.isPending ? (
						<Loader2Icon className="mr-2 size-4 animate-spin" />
					) : (
						<TrashIcon className="mr-2 size-4" />
					)}
					Eliminar foto
				</Button>
			)}
		</div>
	);
}
