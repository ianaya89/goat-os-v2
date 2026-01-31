"use client";

import NiceModal from "@ebay/nice-modal-react";
import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	MoreVerticalIcon,
	PencilIcon,
	Trash2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";

interface CoachProfileActionsProps {
	coachId: string;
	coachName: string;
	isArchived: boolean;
	onEdit?: () => void;
}

export function CoachProfileActions({
	coachId,
	coachName,
	isArchived,
	onEdit,
}: CoachProfileActionsProps) {
	const t = useTranslations("organization.coaches");
	const tCommon = useTranslations("common");
	const tCommonConfirmation = useTranslations("common.confirmation");
	const tCommonSuccess = useTranslations("common.success");
	const router = useRouter();
	const utils = trpc.useUtils();

	const deleteCoachMutation = trpc.organization.coach.delete.useMutation({
		onSuccess: () => {
			toast.success(t("success.deleted"));
			router.push("/dashboard/organization/coaches");
		},
		onError: (error) => {
			toast.error(error.message || t("error.deleteFailed"));
		},
	});

	const archiveCoachMutation = trpc.organization.coach.archive.useMutation({
		onSuccess: () => {
			toast.success(tCommonSuccess("archived"));
			utils.organization.coach.getProfile.invalidate({ id: coachId });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const unarchiveCoachMutation = trpc.organization.coach.unarchive.useMutation({
		onSuccess: () => {
			toast.success(tCommonSuccess("unarchived"));
			utils.organization.coach.getProfile.invalidate({ id: coachId });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleDelete = () => {
		NiceModal.show(ConfirmationModal, {
			title: t("delete.title"),
			message: t("delete.message", { name: coachName }),
			confirmLabel: t("delete.confirm"),
			destructive: true,
			onConfirm: () => deleteCoachMutation.mutate({ id: coachId }),
		});
	};

	const handleArchive = () => {
		NiceModal.show(ConfirmationModal, {
			title: tCommonConfirmation("archiveTitle"),
			message: tCommonConfirmation("archiveMessage"),
			confirmLabel: t("profileActions.archive"),
			onConfirm: () => archiveCoachMutation.mutate({ id: coachId }),
		});
	};

	const handleUnarchive = () => {
		NiceModal.show(ConfirmationModal, {
			title: tCommonConfirmation("unarchiveTitle"),
			message: tCommonConfirmation("unarchiveMessage"),
			confirmLabel: t("profileActions.unarchive"),
			onConfirm: () => unarchiveCoachMutation.mutate({ id: coachId }),
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="group">
					<MoreVerticalIcon className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
					<span className="sr-only">{tCommon("openMenu")}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{onEdit && (
					<DropdownMenuItem onClick={onEdit}>
						<PencilIcon className="mr-2 size-4" />
						{t("profileActions.edit")}
					</DropdownMenuItem>
				)}
				{isArchived ? (
					<DropdownMenuItem onClick={handleUnarchive}>
						<ArchiveRestoreIcon className="mr-2 size-4" />
						{t("profileActions.unarchive")}
					</DropdownMenuItem>
				) : (
					<DropdownMenuItem onClick={handleArchive}>
						<ArchiveIcon className="mr-2 size-4" />
						{t("profileActions.archive")}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleDelete} variant="destructive">
					<Trash2Icon className="mr-2 size-4" />
					{t("profileActions.delete")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
