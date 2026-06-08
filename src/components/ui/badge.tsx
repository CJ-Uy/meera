import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "blue" | "green" | "warning";

const variants: Record<BadgeVariant, string> = {
	default: "bg-[#9BCF53] text-[#4B2B1F]",
	secondary: "bg-white text-[#7A5036]",
	blue: "bg-[#EAF3FF] text-[#2563EB]",
	green: "bg-[#F3FBE8] text-[#6FA334]",
	warning: "bg-[#FFF3D6] text-[#B7791F]",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
	variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
	return (
		<span
			className={cn("inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-extrabold", variants[variant], className)}
			{...props}
		/>
	);
}
