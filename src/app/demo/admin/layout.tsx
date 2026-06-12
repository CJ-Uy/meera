import { LeftRail, MobileAdminNav } from "@/features/admin/components/shell/LeftRail";
import { TopBar } from "@/features/admin/components/shell/TopBar";
import { AdminStoreProvider } from "@/features/admin/store/admin-store";
import type { ReactNode } from "react";

export default function AdminDemoLayout({ children }: { children: ReactNode }) {
	return (
		<AdminStoreProvider>
			<main className="fixed inset-0 z-[100] flex flex-col" style={{ background: "var(--cream)", color: "var(--ink)" }}>
				<TopBar />
				<MobileAdminNav />
				<div className="flex min-h-0 flex-1">
					<LeftRail />
					<section className="min-w-0 flex-1 overflow-y-auto">{children}</section>
				</div>
			</main>
		</AdminStoreProvider>
	);
}
