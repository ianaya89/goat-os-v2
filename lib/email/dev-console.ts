import type { EmailPayload } from "./resend";

/**
 * Log email to console in development mode when Resend is not configured.
 * Displays a nicely formatted box with email details.
 */
export function logEmailToConsole(payload: EmailPayload, from: string): void {
	const separator = "═".repeat(60);
	const thinSeparator = "─".repeat(60);

	console.log("\n");
	console.log(`╔${separator}╗`);
	console.log(`║  📧 EMAIL (Dev Mode - Not Sent)                            ║`);
	console.log(`╠${separator}╣`);
	console.log(`║  From:    ${from.padEnd(48)}║`);
	console.log(`║  To:      ${payload.recipient.padEnd(48)}║`);
	console.log(`║  Subject: ${payload.subject.slice(0, 48).padEnd(48)}║`);
	if (payload.replyTo) {
		console.log(`║  ReplyTo: ${payload.replyTo.padEnd(48)}║`);
	}
	console.log(`╠${separator}╣`);
	console.log(`║  TEXT CONTENT                                              ║`);
	console.log(`╟${thinSeparator}╢`);

	// Log text content with proper formatting
	const textLines = payload.text.split("\n");
	for (const line of textLines.slice(0, 20)) {
		const truncatedLine = line.slice(0, 56);
		console.log(`║  ${truncatedLine.padEnd(57)}║`);
	}
	if (textLines.length > 20) {
		console.log(
			`${`║  ... (${textLines.length - 20} more lines)`.padEnd(60)}║`,
		);
	}

	console.log(`╚${separator}╝`);
	console.log("\n");
}
