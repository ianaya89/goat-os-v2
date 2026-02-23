import { NextResponse } from "next/server";
import { ApiAuthError, validateApiKey } from "@/lib/api/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const spec = {
	openapi: "3.1.0",
	info: {
		title: "GOAT OS API",
		version: "1.0.0",
		description:
			"Read-only REST API for AI agent integration. All endpoints require Bearer token authentication.",
	},
	servers: [{ url: "/api/v1" }],
	security: [{ bearerAuth: [] }],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
			},
		},
		schemas: {
			Error: {
				type: "object",
				properties: {
					error: { type: "string" },
				},
				required: ["error"],
			},
			PaginationParams: {
				type: "object",
				properties: {
					limit: {
						type: "integer",
						minimum: 1,
						maximum: 100,
						default: 50,
					},
					offset: { type: "integer", minimum: 0, default: 0 },
				},
			},
		},
	},
	paths: {
		"/training-sessions": {
			get: {
				operationId: "listTrainingSessions",
				summary: "List training sessions",
				description:
					"Returns paginated training sessions within a date range, with location, group, coaches, and athletes.",
				parameters: [
					{
						name: "from",
						in: "query",
						required: true,
						schema: { type: "string", format: "date" },
						description: "Start date (ISO 8601)",
					},
					{
						name: "to",
						in: "query",
						required: true,
						schema: { type: "string", format: "date" },
						description: "End date (ISO 8601)",
					},
					{
						name: "status",
						in: "query",
						schema: {
							type: "string",
							enum: ["pending", "confirmed", "completed", "cancelled"],
						},
					},
					{
						name: "athleteGroupId",
						in: "query",
						schema: { type: "string", format: "uuid" },
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", default: 50 },
					},
					{
						name: "offset",
						in: "query",
						schema: { type: "integer", default: 0 },
					},
				],
				responses: {
					"200": {
						description: "Paginated list of training sessions",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "array", items: { type: "object" } },
										total: { type: "integer" },
										limit: { type: "integer" },
										offset: { type: "integer" },
									},
								},
							},
						},
					},
					"401": {
						description: "Unauthorized",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/training-sessions/{id}": {
			get: {
				operationId: "getTrainingSession",
				summary: "Get a single training session",
				description:
					"Returns full details of a training session including attendance, coaches, athletes, and evaluations.",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					"200": {
						description: "Training session details",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "object" },
									},
								},
							},
						},
					},
					"404": {
						description: "Not found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/athletes": {
			get: {
				operationId: "listAthletes",
				summary: "List athletes",
				description:
					"Returns paginated list of active athletes with user info and group memberships.",
				parameters: [
					{
						name: "query",
						in: "query",
						schema: { type: "string" },
						description: "Search by athlete name or email",
					},
					{
						name: "status",
						in: "query",
						schema: {
							type: "string",
							enum: ["active", "inactive", "injured", "on_loan"],
						},
					},
					{
						name: "groupId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filter by athlete group",
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", default: 50 },
					},
					{
						name: "offset",
						in: "query",
						schema: { type: "integer", default: 0 },
					},
				],
				responses: {
					"200": {
						description: "Paginated list of athletes",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "array", items: { type: "object" } },
										total: { type: "integer" },
										limit: { type: "integer" },
										offset: { type: "integer" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/attendance/{sessionId}": {
			get: {
				operationId: "getSessionAttendance",
				summary: "Get attendance for a session",
				description:
					"Returns the attendance list for a training session with athlete details.",
				parameters: [
					{
						name: "sessionId",
						in: "path",
						required: true,
						schema: { type: "string", format: "uuid" },
					},
				],
				responses: {
					"200": {
						description: "Attendance records",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "array", items: { type: "object" } },
									},
								},
							},
						},
					},
					"404": {
						description: "Session not found",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/Error" },
							},
						},
					},
				},
			},
		},
		"/payments": {
			get: {
				operationId: "listPayments",
				summary: "List payments",
				description:
					"Returns paginated list of training/event payments with athlete, session, and service details.",
				parameters: [
					{
						name: "from",
						in: "query",
						schema: { type: "string", format: "date" },
						description: "Filter payments from this date (by paymentDate)",
					},
					{
						name: "to",
						in: "query",
						schema: { type: "string", format: "date" },
						description: "Filter payments up to this date (by paymentDate)",
					},
					{
						name: "status",
						in: "query",
						schema: {
							type: "string",
							enum: [
								"pending",
								"processing",
								"paid",
								"partial",
								"failed",
								"refunded",
								"cancelled",
							],
						},
					},
					{
						name: "athleteId",
						in: "query",
						schema: { type: "string", format: "uuid" },
					},
					{
						name: "sessionId",
						in: "query",
						schema: { type: "string", format: "uuid" },
					},
					{
						name: "type",
						in: "query",
						schema: {
							type: "string",
							enum: ["training", "event"],
						},
						description: "Filter by payment type",
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", default: 50 },
					},
					{
						name: "offset",
						in: "query",
						schema: { type: "integer", default: 0 },
					},
				],
				responses: {
					"200": {
						description: "Paginated list of payments",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "array", items: { type: "object" } },
										total: { type: "integer" },
										limit: { type: "integer" },
										offset: { type: "integer" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/expenses": {
			get: {
				operationId: "listExpenses",
				summary: "List expenses",
				description:
					"Returns paginated list of organization expenses with category and recorder details.",
				parameters: [
					{
						name: "from",
						in: "query",
						schema: { type: "string", format: "date" },
						description: "Filter expenses from this date (by expenseDate)",
					},
					{
						name: "to",
						in: "query",
						schema: { type: "string", format: "date" },
						description: "Filter expenses up to this date (by expenseDate)",
					},
					{
						name: "category",
						in: "query",
						schema: {
							type: "string",
							enum: [
								"field_rental",
								"equipment",
								"sports_materials",
								"transport",
								"salaries",
								"commissions",
								"utilities",
								"marketing",
								"insurance",
								"maintenance",
								"facilities",
								"medical",
								"technology",
								"merchandising",
								"food_and_beverages",
								"management",
								"other",
							],
						},
					},
					{
						name: "categoryId",
						in: "query",
						schema: { type: "string", format: "uuid" },
						description: "Filter by custom expense category ID",
					},
					{
						name: "limit",
						in: "query",
						schema: { type: "integer", default: 50 },
					},
					{
						name: "offset",
						in: "query",
						schema: { type: "integer", default: 0 },
					},
				],
				responses: {
					"200": {
						description: "Paginated list of expenses",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										data: { type: "array", items: { type: "object" } },
										total: { type: "integer" },
										limit: { type: "integer" },
										offset: { type: "integer" },
									},
								},
							},
						},
					},
				},
			},
		},
		"/openapi": {
			get: {
				operationId: "getOpenApiSpec",
				summary: "Get OpenAPI specification",
				description: "Returns this OpenAPI 3.1 specification as JSON.",
				responses: {
					"200": {
						description: "OpenAPI specification",
						content: {
							"application/json": {
								schema: { type: "object" },
							},
						},
					},
				},
			},
		},
	},
};

export async function GET(request: Request) {
	try {
		validateApiKey(request);
		return NextResponse.json(spec);
	} catch (error) {
		if (error instanceof ApiAuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}
		logger.error({ error }, "Failed to serve OpenAPI spec");
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
