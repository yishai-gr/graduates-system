import { HDate, gematriya } from "@hebcal/core";
import { isValid, parse } from "date-fns";

export function formatHebrewDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  if (!isValid(date)) return dateStr;

  try {
    const hd = new HDate(date);
    const monthName = date.toLocaleString("he-IL", {
      calendar: "hebrew",
      month: "long",
    });
    return `${gematriya(hd.getDate())} ${monthName} ${gematriya(hd.getFullYear())}`;
  } catch (e) {
    console.error("Error formatting Hebrew date:", e);
    return dateStr;
  }
}
