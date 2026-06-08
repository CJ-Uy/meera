import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
	default:
		"bg-[#9BCF53] text-[#4B2B1F] shadow-[0_10px_24px_rgba(75,43,31,0.12)] hover:bg-[#A9DA66]",
	secondary:
		"border border-[#F8E4C8] bg-white/85 text-[#4B2B1F] shadow-sm hover:bg-white",
	outline:
		"border border-[#F8E4C8] bg-transparent text-[#4B2B1F] hover:bg-white/70",
	ghost: "text-[#7A5036] hover:bg-white/60 hover:text-[#4B2B1F]",
};

const sizes: Record<ButtonSize, string> = {
	default: "min-h-12 px-5 py-2",
	sm: "min-h-10 px-4 py-2 text-xs",
	lg: "min-h-14 px-7 py-3 text-base",
	icon: "size-10 p-0",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
};

export function Button({ asChild = false, children, className, variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
	const classes = cn(
		"inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] disabled:pointer-events-none disabled:opacity-50",
		variants[variant],
		sizes[size],
		className,
	);

	if (asChild && React.isValidElement<{ className?: string }>(children)) {
		return React.cloneElement(children, {
			className: cn(classes, children.props.className),
		});
	}

	return (
		<button
			className={classes}
			type={type}
			{...props}
		>
			{children}
		</button>
	);
}
