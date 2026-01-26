import type { Graduate } from "@/types";

export interface ProfileStatus {
  percentage: number;
  color: string;
  label: string;
}

export function calculateProfileStatus(graduate: Graduate): ProfileStatus {
  let score = 0;

  // Max score: 100
  // Weights:
  // FirstName: 15
  // LastName: 15
  // Phone: 20
  // Email: 15
  // City: 7.5
  // Address: 7.5
  // --> Subtotal: 80

  // TeudatZehut: 5
  // BirthDate: 5
  // ShiurYear: 5
  // StudentCode: 5
  // --> Subtotal: 20

  if (graduate.first_name?.trim()) score += 15;
  if (graduate.last_name?.trim()) score += 15;
  if (graduate.phone?.trim()) score += 20;
  if (graduate.email?.trim()) score += 15;
  if (graduate.city?.trim()) score += 7.5;
  if (graduate.address?.trim()) score += 7.5;
  if (graduate.teudat_zehut?.trim()) score += 5;
  if (graduate.birth_date?.trim()) score += 5;
  if (graduate.shiur_year) score += 5; // string is truthy if not empty
  if (graduate.student_code?.trim()) score += 5;

  // Normalize score to integer for cleaner display, but float is fine for internal logic
  // Let's ceil it or round it.
  const percentage = Math.min(100, Math.round(score));

  let color = "bg-red-500"; // Default Red
  let label = "חסר מידע קריטי";

  if (percentage >= 95) {
    color = "bg-indigo-500"; // Dark Green / Blue? User said "Dark Green / Blue". Emerald is nice.
    label = "מלא לחלוטין";
  } else if (percentage >= 80) {
    color = "bg-green-500"; // Green
    label = "נתונים חשובים מלאים";
  } else if (percentage >= 50) {
    color = "bg-orange-400"; // Orange
    label = "חלקי";
  }

  return { percentage, color, label };
}
