"use client";

import {
	ChevronLeftIcon,
	CopyIcon,
	MailIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

type ReportStatus = "idle" | "sending" | "sent" | "error";

export function ErrorPage({ error, reset }: ErrorPageProps) {
	const t = useTranslations("errors.page");
	const [copied, setCopied] = React.useState(false);
	const [reportStatus, setReportStatus] = React.useState<ReportStatus>("idle");

	const goBack = () => {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			window.location.href = "/";
		}
	};

	const copyErrorDetails = () => {
		const details = [
			`Error: ${error.message}`,
			error.digest ? `Digest: ${error.digest}` : null,
			`Timestamp: ${new Date().toISOString()}`,
			`URL: ${typeof window !== "undefined" ? window.location.href : ""}`,
		]
			.filter(Boolean)
			.join("\n");

		navigator.clipboard.writeText(details);
		setCopied(true);
	};

	const reportError = async () => {
		if (reportStatus === "sending" || reportStatus === "sent") return;

		setReportStatus("sending");

		try {
			const response = await fetch("/api/report-error", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					errorMessage: error.message || "Unknown error",
					errorDigest: error.digest,
					errorUrl: typeof window !== "undefined" ? window.location.href : "",
					userAgent:
						typeof navigator !== "undefined" ? navigator.userAgent : undefined,
				}),
			});

			if (response.ok) {
				setReportStatus("sent");
			} else {
				setReportStatus("error");
			}
		} catch {
			setReportStatus("error");
		}
	};

	// Clear "copied" state after timeout with proper cleanup
	React.useEffect(() => {
		if (!copied) return;
		const timeoutId = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timeoutId);
	}, [copied]);

	// Reset error status after timeout
	React.useEffect(() => {
		if (reportStatus !== "error") return;
		const timeoutId = setTimeout(() => setReportStatus("idle"), 3000);
		return () => clearTimeout(timeoutId);
	}, [reportStatus]);

	const getReportButtonText = () => {
		switch (reportStatus) {
			case "sending":
				return t("reportSending");
			case "sent":
				return t("reportSent");
			case "error":
				return t("reportFailed");
			default:
				return t("reportError");
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-marketing-bg px-6 py-16">
			<div className="w-full max-w-lg text-center">
				<p className="text-sm font-semibold text-marketing-fg-subtle">
					{t("subtitle")}
				</p>

				<h1
					className={cn(
						"mt-4 font-display text-[2rem] leading-10 tracking-tight",
						"text-marketing-fg",
						"sm:text-5xl sm:leading-14",
					)}
				>
					{t("title")}
				</h1>

				<p className="mx-auto mt-4 max-w-md text-base leading-7 text-marketing-fg-muted">
					{t("description")}
				</p>

				<div className="mt-8 rounded-xl bg-marketing-card p-6 text-left">
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-marketing-fg">
								{t("errorMessage")}
							</p>
							<p className="mt-1 wrap-break-word font-mono text-sm text-marketing-fg-muted">
								{error.message || t("unknownError")}
							</p>
						</div>
						<button
							type="button"
							onClick={copyErrorDetails}
							className={cn(
								"inline-flex shrink-0 items-center justify-center rounded-full p-2",
								"text-marketing-fg hover:bg-marketing-card-hover",
								"dark:hover:bg-white/10",
							)}
						>
							<CopyIcon className="size-4" />
							<span className="sr-only">Copy error details</span>
						</button>
					</div>
					{error.digest && (
						<div className="mt-4 border-t border-marketing-border pt-4">
							<p className="text-sm font-semibold text-marketing-fg">
								{t("errorId")}
							</p>
							<p className="mt-1 font-mono text-xs text-marketing-fg-muted">
								{error.digest}
							</p>
						</div>
					)}
					{copied && (
						<p className="mt-4 text-xs text-marketing-fg-subtle">
							{t("copiedToClipboard")}
						</p>
					)}
				</div>

				<div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
					<button
						type="button"
						onClick={reset}
						className={cn(
							"inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
							"bg-marketing-accent text-marketing-accent-fg hover:bg-marketing-accent-hover",
						)}
					>
						<RefreshCwIcon className="size-4" />
						{t("tryAgain")}
					</button>
					<button
						type="button"
						onClick={goBack}
						className={cn(
							"inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
							"text-marketing-fg hover:bg-marketing-card-hover",
							"dark:hover:bg-white/10",
						)}
					>
						<ChevronLeftIcon className="size-4" />
						{t("goBack")}
					</button>
					<button
						type="button"
						onClick={reportError}
						disabled={reportStatus === "sending" || reportStatus === "sent"}
						className={cn(
							"inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
							"text-marketing-fg hover:bg-marketing-card-hover",
							"dark:hover:bg-white/10",
							"disabled:cursor-not-allowed disabled:opacity-50",
							reportStatus === "sent" && "text-green-600 dark:text-green-400",
							reportStatus === "error" && "text-red-600 dark:text-red-400",
						)}
					>
						<MailIcon className="size-4" />
						{getReportButtonText()}
					</button>
				</div>
			</div>
		</div>
	);
}
