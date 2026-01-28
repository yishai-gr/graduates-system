export function isValidIsraeliID(id: string): boolean {
  if (id.length !== 9) {
    // Pad with leading zeros if length < 9? Usually input is expected to be 9.
    // However, the algorithm technically works on any length if we treat them as digits.
    // But standard Israeli ID is 9 digits (including check digit).
    // Let's enforce 9 digits for strictness, or pad.
    // Common practice: input must be up to 9 digits.
    if (id.length > 9 || id.length === 0) return false;
    id = id.padStart(9, "0");
  }

  // Israeli ID validation based on Luhn algorithm (mod 10)
  // 1. Iterate over digits.
  // 2. Multiply each digit by its weight (1, 2, 1, 2...).
  // 3. If result > 9, sum the digits of the result (or substract 9).
  // 4. Sum all results.
  // 5. Total must be divisible by 10.

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(id.charAt(i), 10);
    if (isNaN(digit)) return false;

    let step = digit * ((i % 2) + 1);
    if (step > 9) step -= 9;
    sum += step;
  }

  return sum % 10 === 0;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidIsraeliPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Israeli phone numbers are 9 digits (landline) or 10 digits (mobile).
  // Leading zero is required.
  if (!/^0\d{8,9}$/.test(normalized)) {
    return false;
  }
  return true;
}
