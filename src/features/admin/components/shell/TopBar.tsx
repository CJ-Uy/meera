"use client";

import { ActAsSwitcher } from "@/features/admin/components/shell/ActAsSwitcher";
import { DepartmentDropdown } from "@/features/admin/components/shell/DepartmentDropdown";
import { DemoHeader } from "@/components/demo/demo-header";

export function TopBar() {
	return (
		<DemoHeader persona="admin">
			<DepartmentDropdown />
			<ActAsSwitcher />
		</DemoHeader>
	);
}
