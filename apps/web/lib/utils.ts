import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return "$";
  const upper = currency.toUpperCase();
  if (upper.includes("EUR") || upper.includes("€")) return "€";
  if (upper.includes("GBP") || upper.includes("£")) return "£";
  if (upper.includes("JPY") || upper.includes("¥")) return "¥";
  if (upper.includes("CAD")) return "CA$";
  if (upper.includes("AUD")) return "A$";
  if (upper.includes("INR") || upper.includes("₹")) return "₹";
  if (upper.includes("AED")) return "AED ";
  if (upper.includes("CHF")) return "CHF ";
  return "$";
}

export function formatCurrency(amount: number, currency?: string | null): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString()}`;
}

