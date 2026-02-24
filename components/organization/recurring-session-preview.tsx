"use client";

import { format } from "date-fns";
import {
	AlertTriangleIcon,
	ArrowLeftIcon,
	CalendarDaysIcon,
	Loader2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecurringSessionPreviewProps {
	sessions: Array<{ startTime: Date; endTime: Date }>;
	total: number;
	limitReached: boolean;
	sessionTitle: string;
	onBack: () => void;
	onConfirm: () => void;
	isPending: boolean;
}

export function RecurringSessionPreview({
	sessions,
	total,
	limitReached,
	sessionTitle,
	onBack,
	onConfirm,
	isPending,
}: RecurringSessionPreviewProps) {
	const t = useTranslations("training.recurring.preview");

	return (
		<div className="flex h-full flex-col gap-4">
			{/* Header */}
			<div className="space-y-1">
				<h3 className="font-semibold text-lg">{t("title")}</h3>
				<p className="text-muted-foreground text-sm">{t("subtitle")}</p>
			</div>

			{/* Count banner */}
			<div className="flex items-center gap-2">
				<Badge variant="secondary" className="text-sm">
					{t("sessionsCount", { count: total })}
				</Badge>
				{sessionTitle && (
					<span className="truncate text-muted-foreground text-sm">
						&mdash; {sessionTitle}
					</span>
				)}
			</div>

			{/* Limit warning */}
			{limitReached && (
				<Alert variant="destructive">
					<AlertTriangleIcon className="size-4" />
					<AlertDescription>
						{t("limitWarning", { max: total })}
					</AlertDescription>
				</Alert>
			)}

			{/* Sessions list */}
			<ScrollArea className="flex-1 rounded-md border">
				<div className="divide-y">
					{sessions.map((session, index) => (
						<div
							key={`${session.startTime.toISOString()}-${index}`}
							className="flex items-center gap-3 px-4 py-3"
						>
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
								{index + 1}
							</span>
							<CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
							<div className="flex flex-1 items-center justify-between gap-2 text-sm">
								<span className="font-medium">
									{format(session.startTime, "EEE, dd MMM yyyy")}
								</span>
								<span className="text-muted-foreground">
									{format(session.startTime, "HH:mm")} –{" "}
									{format(session.endTime, "HH:mm")}
								</span>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>

			{/* Action buttons */}
			<div className="flex items-center justify-between gap-3 border-t pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					disabled={isPending}
				>
					<ArrowLeftIcon className="mr-2 size-4" />
					{t("back")}
				</Button>
				<Button type="button" onClick={onConfirm} disabled={isPending}>
					{isPending ? (
						<>
							<Loader2Icon className="mr-2 size-4 animate-spin" />
							{t("creating", { count: total })}
						</>
					) : (
						t("confirm", { count: total })
					)}
				</Button>
			</div>
		</div>
	);
}
