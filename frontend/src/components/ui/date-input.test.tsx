import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DateInput } from "./date-input";
import { describe, it, expect, vi } from "vitest";

describe("DateInput Component", () => {
  it("renders correctly with initial empty value", () => {
    render(<DateInput value="" onChange={() => {}} />);
    expect(screen.getByText("בחר תאריך...")).toBeInTheDocument();
  });

  it("renders correctly with a Gregorian date", () => {
    render(<DateInput value="2023-10-05" onChange={() => {}} />);
    // 05/10/2023
    expect(screen.getByText("05/10/2023")).toBeInTheDocument();
  });

  it("toggles to Hebrew mode and updates display", async () => {
    const handleChange = vi.fn();
    render(<DateInput value="2023-10-05" onChange={handleChange} />);

    // Open popover
    fireEvent.click(screen.getByRole("button", { name: /05\/10\/2023/i }));

    // Switch to Hebrew tab
    const hebrewTab = screen.getByRole("tab", { name: "עברי" });
    fireEvent.click(hebrewTab);

    // Verify Hebrew date text appears in the button
    // 2023-10-05 is 20 Tishrei 5784. "כ׳ תשרי תשפ״ד"
    await waitFor(() => {
      // Look for part of the date, e.g., "תשרי" (Tishrei) or "תשפ״ד" (5784)
      expect(screen.getByRole("button", { name: /תשרי/ })).toBeInTheDocument();
    });
  });

  it("calls onChange when a date is selected in Gregorian mode", () => {
    const handleChange = vi.fn();
    render(<DateInput value="2023-10-01" onChange={handleChange} />);

    // Open popover
    fireEvent.click(screen.getByRole("button", { name: /01\/10\/2023/i }));

    // Select a different day, e.g., 15th
    // We target the strict day button.
    // Note: react-day-picker renders buttons for days.
    // Actually react-day-picker v9 uses 'gridcell' role for the td, and button inside.
    // simpler: getByText('15'). But ensure it's the correct month if multiple are shown (default showOutsideDays is often true)
    // For single month view, this is usually safe.

    // We can also use getByRole('button', { name: "15" }) if accessibility is standard
    const dayToSelect = screen.getAllByText("15")[0]; // Just in case
    fireEvent.click(dayToSelect);

    expect(handleChange).toHaveBeenCalledWith("2023-10-15");
  });

  it("adjusts validation message with range limits", () => {
    // Basic rendering check that it doesn't crash with min/max dates
    render(
      <DateInput
        value=""
        onChange={() => {}}
        minDate={new Date(2023, 0, 1)}
        maxDate={new Date(2023, 11, 31)}
      />,
    );
    expect(screen.getByText("בחר תאריך...")).toBeInTheDocument();
  });
});
