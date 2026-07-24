import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Ethiopian Birr, e.g. formatETB(1500) -> "1,500 ETB"
 */
export function formatETB(amount: number | null | undefined) {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;
}
