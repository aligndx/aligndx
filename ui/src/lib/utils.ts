import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number
    sizeType?: "accurate" | "normal"
  } = {}
) {
  const { decimals = 0, sizeType = "normal" } = opts

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"]
  if (bytes === 0) return "0 Byte"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`
}

export const getCssVariableValue = (variableName: string) => {
  const rawValue = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

  // Check if the value is a valid hsl color value (space-separated HSL parts)
  if (rawValue && rawValue.includes(" ")) {
      return `hsl(${rawValue})`;  // Convert the HSL components into a valid hsl() string
  }
  return rawValue;
};


export const capitalize = (str: string) => {
  const firstletter = str.charAt(0).toLocaleUpperCase() 
  const restOfLetters = str.slice(1)
  return firstletter + restOfLetters
}