import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// After a pagination click the buttons are at the bottom, so bring the section's heading back into view.
// scroll-padding-top in globals.css keeps the heading clear of the fixed header.
export function scrollToSectionTop(element: HTMLElement | null) {
  const section = element?.closest("section") ?? element
  section?.scrollIntoView({ behavior: "smooth", block: "start" })
}
