import { createApiAdminDataSource } from "@/features/admin/store/api-source";
import type { AdminDataSource } from "@/features/admin/store/data-source";
import { inMemoryAdminDataSource } from "@/features/admin/store/in-memory-source";

export type AdminSourceMode = "api" | "memory";

export function getAdminSourceMode(value = process.env.NEXT_PUBLIC_ADMIN_SOURCE): AdminSourceMode {
	return value === "api" ? "api" : "memory";
}

export function createConfiguredAdminDataSource(getActingAdminId: () => string | null): AdminDataSource {
	return getAdminSourceMode() === "api" ? createApiAdminDataSource(getActingAdminId) : inMemoryAdminDataSource;
}
