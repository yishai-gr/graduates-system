import { HDate } from "@hebcal/core";

export function getHebrewYears(
  countBack: number = 100,
  countForward: number = 10,
): { value: string; label: string }[] {
  const currentYear = new HDate().getFullYear();
  const startYear = currentYear - countBack;
  const endYear = currentYear + countForward;

  const years: { value: string; label: string }[] = [];

  for (let year = endYear; year >= startYear; year--) {
    const yearStr = formatHebrewYear(year);
    years.push({
      value: yearStr,
      label: yearStr, // We might want to add secular year in parens later: `${yearStr} (${year - 3760})`
    });
  }

  return years;
}

// Convert Hebrew year number to string (Gematriya-like)
// Simple implementation or use library if available.
// @hebcal/core has `gematriya` but we need to check if it's exported or how to use it.
// Actually, let's implement a simple formatter or check if `HDate` has it.
// HDate doesn't seem to have static formatter for just year number exported easily in types.
// But we can create an HDate for that year and get the year string.

function formatHebrewYear(year: number): string {
  // We only care about the last 3 digits for "Tash.." format (ignoring thousands)
  // e.g. 5784 -> 784 -> תשפ"ד
  const shortYear = year % 1000;
  return toGematriya(shortYear);
}

function toGematriya(num: number): string {
  if (num === 0) return "";

  const letters: { val: number; char: string }[] = [
    { val: 400, char: "ת" },
    { val: 300, char: "ש" },
    { val: 200, char: "ר" },
    { val: 100, char: "ק" },
    { val: 90, char: "צ" },
    { val: 80, char: "פ" },
    { val: 70, char: "ע" },
    { val: 60, char: "ס" },
    { val: 50, char: "נ" },
    { val: 40, char: "מ" },
    { val: 30, char: "ל" },
    { val: 20, char: "כ" },
    { val: 10, char: "י" },
    { val: 9, char: "ט" },
    { val: 8, char: "ח" },
    { val: 7, char: "ז" },
    { val: 6, char: "ו" },
    { val: 5, char: "ה" },
    { val: 4, char: "ד" },
    { val: 3, char: "ג" },
    { val: 2, char: "ב" },
    { val: 1, char: "א" },
  ];

  let result = "";
  let temp = num;

  while (temp > 0) {
    // Special cases for 15 (Tu) and 16 (Tet-Zayin) to avoid God's name
    // This usually happens at the end of the number logic.
    // However, since we process largest to smallest, we need to check remainders carefully?
    // Actually, simplest greedy approach works mostly, but we need to check for 15/16 at the end.

    // Check if remaining is exactly 15 or 16
    if (temp === 15) {
      result += "טו";
      temp = 0;
      break;
    }
    if (temp === 16) {
      result += "טז";
      temp = 0;
      break;
    }

    // Find largest letter <= temp
    let found = false;
    for (const { val, char } of letters) {
      if (temp >= val) {
        result += char;
        temp -= val;
        found = true;
        break;
      }
    }

    if (!found) break; // Should not happen
  }

  // Add gershayim or geresh
  if (result.length > 1) {
    return result.slice(0, -1) + '"' + result.slice(-1);
  } else {
    return result + "'";
  }
}
