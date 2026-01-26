"use client";

import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsJson,
	parseAsString,
	useQueryState,
} from "nuqs";
import * as React from "react";
import { appConfig } from "@/config/app.config";

const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: false }];

export interface UseTableQueryStateOptions {
	/**
	 * Filter keys to sync with URL state.
	 * Each key will create a separate URL parameter.
	 */
	filterKeys?: string[];
	/**
	 * Default sorting configuration.
	 */
	defaultSorting?: SortingState;
	/**
	 * Default page size.
	 */
	defaultPageSize?: number;
}

export interface TableQueryState {
	// Search
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	// Pagination
	pageIndex: number;
	setPageIndex: (value: number) => void;
	pageSize: number;
	setPageSize: (value: number) => void;
	// Sorting
	sorting: SortingState;
	setSorting: (value: SortingState) => void;
	handleSortingChange: (newSorting: SortingState) => void;
	// Filters
	filters: Record<string, string[]>;
	setFilter: (key: string, value: string[]) => void;
	columnFilters: ColumnFiltersState;
	handleFiltersChange: (filters: ColumnFiltersState) => void;
	// Computed values
	offset: number;
	limit: number;
	// Reset
	resetFilters: () => void;
	resetPagination: () => void;
}

/**
 * Custom hook to manage table query state with URL synchronization.
 * Reduces boilerplate in table components by providing a unified interface
 * for search, pagination, sorting, and filtering.
 */
export function useTableQueryState(
	options: UseTableQueryStateOptions = {},
): TableQueryState {
	const {
		filterKeys = ["status", "createdAt"],
		defaultSorting = DEFAULT_SORTING,
		defaultPageSize = appConfig.pagination.defaultLimit,
	} = options;

	// Search
	const [searchQuery, setSearchQuery] = useQueryState(
		"query",
		parseAsString.withDefault("").withOptions({ shallow: true }),
	);

	// Pagination
	const [pageIndex, setPageIndex] = useQueryState(
		"pageIndex",
		parseAsInteger.withDefault(0).withOptions({ shallow: true }),
	);

	const [pageSize, setPageSize] = useQueryState(
		"pageSize",
		parseAsInteger.withDefault(defaultPageSize).withOptions({ shallow: true }),
	);

	// Sorting
	const [sorting, setSorting] = useQueryState<SortingState>(
		"sort",
		parseAsJson<SortingState>((value) => {
			if (!Array.isArray(value)) return defaultSorting;
			return value.filter(
				(item) =>
					item &&
					typeof item === "object" &&
					"id" in item &&
					typeof item.desc === "boolean",
			) as SortingState;
		})
			.withDefault(defaultSorting)
			.withOptions({ shallow: true }),
	);

	// Dynamic filters - create a state for each filter key
	const _filterStates = React.useMemo(() => {
		const states: Record<string, [string[], (value: string[]) => void]> = {};
		return states;
	}, []);

	// For simplicity, we'll use individual useQueryState calls for common filters
	const [statusFilter, setStatusFilter] = useQueryState(
		"status",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [createdAtFilter, setCreatedAtFilter] = useQueryState(
		"createdAt",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [levelFilter, setLevelFilter] = useQueryState(
		"level",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [typeFilter, setTypeFilter] = useQueryState(
		"type",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	const [categoryFilter, setCategoryFilter] = useQueryState(
		"category",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: true }),
	);

	// Filter accessors map
	const filterMap: Record<string, [string[], (value: string[]) => void]> = {
		status: [statusFilter ?? [], setStatusFilter],
		createdAt: [createdAtFilter ?? [], setCreatedAtFilter],
		level: [levelFilter ?? [], setLevelFilter],
		type: [typeFilter ?? [], setTypeFilter],
		category: [categoryFilter ?? [], setCategoryFilter],
	};

	// Build filters object
	const filters = React.useMemo(() => {
		const result: Record<string, string[]> = {};
		for (const key of filterKeys) {
			const state = filterMap[key];
			if (state) {
				result[key] = state[0];
			}
		}
		return result;
	}, [
		filterKeys,
		statusFilter,
		createdAtFilter,
		levelFilter,
		typeFilter,
		categoryFilter,
	]);

	// Set a specific filter
	const setFilter = React.useCallback(
		(key: string, value: string[]) => {
			const state = filterMap[key];
			if (state) {
				state[1](value);
				if (pageIndex !== 0) {
					setPageIndex(0);
				}
			}
		},
		[filterMap, pageIndex, setPageIndex],
	);

	// Build columnFilters from URL state
	const columnFilters: ColumnFiltersState = React.useMemo(() => {
		const result: ColumnFiltersState = [];
		for (const [key, value] of Object.entries(filters)) {
			if (value && value.length > 0) {
				result.push({ id: key, value });
			}
		}
		return result;
	}, [filters]);

	// Handle filters change from DataTable
	const handleFiltersChange = React.useCallback(
		(newFilters: ColumnFiltersState) => {
			const getFilterValue = (id: string): string[] => {
				const filter = newFilters.find((f) => f.id === id);
				return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
			};

			for (const key of filterKeys) {
				const state = filterMap[key];
				if (state) {
					state[1](getFilterValue(key));
				}
			}

			if (pageIndex !== 0) {
				setPageIndex(0);
			}
		},
		[filterKeys, filterMap, pageIndex, setPageIndex],
	);

	// Handle sorting change
	const handleSortingChange = React.useCallback(
		(newSorting: SortingState) => {
			setSorting(newSorting.length > 0 ? newSorting : defaultSorting);
			if (pageIndex !== 0) {
				setPageIndex(0);
			}
		},
		[defaultSorting, pageIndex, setPageIndex, setSorting],
	);

	// Handle search query change with pagination reset
	const handleSearchQueryChange = React.useCallback(
		(value: string) => {
			if (value !== searchQuery) {
				setSearchQuery(value);
				if (pageIndex !== 0) {
					setPageIndex(0);
				}
			}
		},
		[searchQuery, setSearchQuery, pageIndex, setPageIndex],
	);

	// Reset functions
	const resetFilters = React.useCallback(() => {
		for (const key of filterKeys) {
			const state = filterMap[key];
			if (state) {
				state[1]([]);
			}
		}
	}, [filterKeys, filterMap]);

	const resetPagination = React.useCallback(() => {
		setPageIndex(0);
	}, [setPageIndex]);

	// Computed values
	const offset = (pageIndex || 0) * (pageSize || defaultPageSize);
	const limit = pageSize || defaultPageSize;

	return {
		// Search
		searchQuery: searchQuery || "",
		setSearchQuery: handleSearchQueryChange,
		// Pagination
		pageIndex: pageIndex || 0,
		setPageIndex,
		pageSize: pageSize || defaultPageSize,
		setPageSize,
		// Sorting
		sorting: sorting || defaultSorting,
		setSorting,
		handleSortingChange,
		// Filters
		filters,
		setFilter,
		columnFilters,
		handleFiltersChange,
		// Computed
		offset,
		limit,
		// Reset
		resetFilters,
		resetPagination,
	};
}

/**
 * Helper to build sort params for tRPC queries from sorting state.
 */
export function buildSortParams<T extends string>(
	sorting: SortingState,
	validFields: readonly T[],
	defaultField: T = "createdAt" as T,
): { sortBy: T; sortOrder: "asc" | "desc" } {
	const fallbackSort = { id: defaultField, desc: false };
	const currentSort = sorting?.[0] ?? fallbackSort;
	const sortBy = validFields.includes(currentSort.id as T)
		? (currentSort.id as T)
		: defaultField;
	const sortOrder = currentSort.desc ? "desc" : "asc";
	return { sortBy, sortOrder };
}
