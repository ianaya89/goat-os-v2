"use client";

import { AlertTriangleIcon, PackageIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

export function LowStockCard(): React.JSX.Element {
	const { data, isLoading } = trpc.organization.stock.listProducts.useQuery({
		lowStock: true,
	});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-full" />
				</CardContent>
			</Card>
		);
	}

	const lowStockProducts = data ?? [];
	const criticalCount = lowStockProducts.filter(
		(p) => p.currentStock === 0,
	).length;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<PackageIcon className="size-5 text-orange-500" />
							Productos con Bajo Stock
						</CardTitle>
						<CardDescription>
							Productos que necesitan reposicion
						</CardDescription>
					</div>
					{lowStockProducts.length > 0 && (
						<Badge variant="destructive" className="flex items-center gap-1">
							<AlertTriangleIcon className="size-3" />
							{lowStockProducts.length}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{lowStockProducts.length > 0 ? (
					<div className="space-y-3">
						{/* Summary Stats */}
						<div className="flex gap-4 rounded-lg bg-muted/50 p-3">
							<div className="flex flex-col items-center flex-1">
								<span className="text-2xl font-bold text-orange-600">
									{lowStockProducts.length}
								</span>
								<span className="text-muted-foreground text-xs text-center">
									Bajo stock
								</span>
							</div>
							{criticalCount > 0 && (
								<div className="flex flex-col items-center flex-1">
									<span className="text-2xl font-bold text-red-600">
										{criticalCount}
									</span>
									<span className="text-muted-foreground text-xs text-center">
										Sin stock
									</span>
								</div>
							)}
						</div>

						{/* Products List */}
						<div className="space-y-2">
							{lowStockProducts.slice(0, 5).map((product) => (
								<div
									key={product.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-3">
										<div
											className={cn(
												"flex size-9 items-center justify-center rounded-lg",
												product.currentStock === 0
													? "bg-red-100 dark:bg-red-900"
													: "bg-orange-100 dark:bg-orange-900",
											)}
										>
											<ShoppingCartIcon
												className={cn(
													"size-4",
													product.currentStock === 0
														? "text-red-600"
														: "text-orange-600",
												)}
											/>
										</div>
										<div>
											<p className="font-medium text-sm">{product.name}</p>
											<p className="text-muted-foreground text-xs">
												{product.sku && `SKU: ${product.sku}`}
											</p>
										</div>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Badge
											variant={
												product.currentStock === 0 ? "destructive" : "secondary"
											}
											className="text-xs"
										>
											Stock: {product.currentStock}
										</Badge>
										<span className="text-muted-foreground text-xs">
											Min: {product.lowStockThreshold}
										</span>
									</div>
								</div>
							))}
						</div>

						{lowStockProducts.length > 5 && (
							<Button variant="ghost" size="sm" asChild className="w-full">
								<Link href="/dashboard/organization/products?lowStock=true">
									Ver todos ({lowStockProducts.length} productos)
								</Link>
							</Button>
						)}

						<Button variant="outline" size="sm" asChild className="w-full">
							<Link href="/dashboard/organization/products">
								Gestionar Productos
							</Link>
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center py-6 text-center">
						<PackageIcon className="size-10 text-green-500/50 mb-2" />
						<p className="text-muted-foreground text-sm">
							Todos los productos tienen stock suficiente
						</p>
						<Button variant="link" size="sm" asChild className="mt-2">
							<Link href="/dashboard/organization/products">Ver Productos</Link>
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
