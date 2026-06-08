import * as React from "react";
import { cn } from "@/lib/utils";

export function NavigationMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("flex items-center", className)} {...props} />;
}

export function NavigationMenuList({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
	return <ul className={cn("flex items-center gap-6", className)} {...props} />;
}

export function NavigationMenuItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
	return <li className={cn("list-none", className)} {...props} />;
}

export function NavigationMenuLink({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	return (
		<a
			className={cn("text-sm font-bold text-[#7A5036] transition hover:text-[#4B2B1F] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]", className)}
			{...props}
		/>
	);
}
