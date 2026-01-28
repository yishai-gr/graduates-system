import * as React from "react";
import { DayPicker } from "react-day-picker/hebrew";
import {
  useDayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { HDate, gematriya } from "@hebcal/core";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";

/**
 * KNOWN LIMITATION: Hebrew Calendar Grid Structure
 *
 * This component uses `react-day-picker` which is inherently Gregorian-based.
 * The calendar grid displays Gregorian month structure (e.g., April 1-30) with
 * Hebrew date labels overlaid. This means:
 *
 * - Grid shows ~30 days of a Gregorian month
 * - Hebrew dates are correctly calculated and displayed
 * - A Hebrew month (e.g., Nisan) may span across two Gregorian months
 * - Users see correct Hebrew dates but in Gregorian grid layout
 *
 * This is an INTENTIONAL LIMITATION - not a bug to fix.
 * Date selection logic is correct. Users can reliably select Hebrew dates
 * via the month/year dropdowns and grid.
 *
 * To implement a true Hebrew month grid would require:
 * - Custom grid rendering (breaking accessibility/keyboard nav)
 * - Complex modifier/selection logic reimplementation
 * - Significant maintenance burden
 *
 * Decision: Accept limitation, document clearly, ensure selection works correctly.
 */

function HebrewCaption({ calendarMonth }: { calendarMonth: { date: Date } }) {
  const { goToMonth, dayPickerProps } = useDayPicker();
  const currentMonth = calendarMonth.date;

  const currentHDate = React.useMemo(
    () => new HDate(currentMonth),
    [currentMonth],
  );
  const currentHYear = currentHDate.getFullYear();
  const currentHMonth = currentHDate.getMonthName();

  const { startMonth, endMonth } = dayPickerProps;

  // Memoize year range calculation
  const years = React.useMemo(() => {
    const minYear = startMonth
      ? new HDate(startMonth).getFullYear()
      : currentHYear - 10;
    const maxYear = endMonth
      ? new HDate(endMonth).getFullYear()
      : currentHYear + 10;

    const result = [];
    for (let y = minYear; y <= maxYear; y++) {
      result.push(y);
    }
    return result;
  }, [startMonth, endMonth, currentHYear]);

  // Memoize month options with pre-computed labels
  const monthOptions = React.useMemo(() => {
    const isLeap = new HDate(1, "Tishrei", currentHYear).isLeapYear();
    const monthNames = isLeap
      ? [
          "Tishrei",
          "Cheshvan",
          "Kislev",
          "Tevet",
          "Sh'vat",
          "Adar I",
          "Adar II",
          "Nisan",
          "Iyyar",
          "Sivan",
          "Tamuz",
          "Av",
          "Elul",
        ]
      : [
          "Tishrei",
          "Cheshvan",
          "Kislev",
          "Tevet",
          "Sh'vat",
          "Adar",
          "Nisan",
          "Iyyar",
          "Sivan",
          "Tamuz",
          "Av",
          "Elul",
        ];

    return monthNames.map((m) => {
      const d = new HDate(1, m, currentHYear).greg();
      const label = d.toLocaleString("he-IL", {
        calendar: "hebrew",
        month: "long",
      });
      return { value: m, label };
    });
  }, [currentHYear]);

  // Memoize year options with pre-computed gematriya labels
  const yearOptions = React.useMemo(() => {
    return years.map((y) => ({ value: y, label: gematriya(y) }));
  }, [years]);

  const handleYearChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newYear = parseInt(e.target.value, 10);
      let targetMonth = currentHMonth;
      const isNewYearLeap = new HDate(1, "Tishrei", newYear).isLeapYear();

      if (targetMonth === "Adar II" && !isNewYearLeap) {
        targetMonth = "Adar";
      } else if (targetMonth === "Adar I" && !isNewYearLeap) {
        targetMonth = "Adar";
      } else if (targetMonth === "Adar" && isNewYearLeap) {
        targetMonth = "Adar II";
      }

      try {
        goToMonth(new HDate(1, targetMonth, newYear).greg());
      } catch {
        goToMonth(new HDate(1, "Tishrei", newYear).greg());
      }
    },
    [currentHMonth, goToMonth],
  );

  const handleMonthChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMonth = e.target.value;
      goToMonth(new HDate(1, newMonth, currentHYear).greg());
    },
    [currentHYear, goToMonth],
  );

  return (
    <div className="flex items-center justify-center gap-1 z-20 flex-wrap">
      <select
        value={currentHMonth}
        onChange={handleMonthChange}
        className="opacity-100 relative z-20 appearance-auto cursor-pointer py-1 px-2 border rounded-md bg-background text-foreground text-sm font-normal shadow-sm h-8 min-w-0 max-w-[120px]"
      >
        {monthOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={currentHYear}
        onChange={handleYearChange}
        className="opacity-100 relative z-20 appearance-auto cursor-pointer py-1 px-2 border rounded-md bg-background text-foreground text-sm font-normal shadow-sm h-8 min-w-0"
      >
        {yearOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function HebrewCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  startMonth: _startMonth,
  endMonth: _endMonth,
  startYear,
  endYear,
  buttonVariant = "ghost",
  formatters: _formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  /** Hebrew year to start from (e.g., 5780). Takes priority over startMonth. */
  startYear?: number;
  /** Hebrew year to end at (e.g., 5790). Takes priority over endMonth. */
  endYear?: number;
}) {
  const defaultClassNames = getDefaultClassNames();

  // Memoize range calculation
  const { startMonth, endMonth } = React.useMemo(() => {
    const currentYear = new HDate().getFullYear();
    return {
      startMonth: startYear
        ? new HDate(1, "Tishrei", startYear).greg()
        : _startMonth || new HDate(1, "Tishrei", currentYear - 120).greg(),
      endMonth: endYear
        ? new HDate(29, "Elul", endYear).greg()
        : _endMonth || new HDate(29, "Elul", currentYear + 20).greg(),
    };
  }, [_startMonth, _endMonth, startYear, endYear]);

  // Memoize formatters
  const formatters = React.useMemo(
    () => ({
      formatDay: (date: Date) => gematriya(new HDate(date).getDate()),
      // Dropdown formatters removed as we use custom Caption
      ..._formatters,
    }),
    [_formatters],
  );

  return (
    <DayPicker
      dir="rtl"
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(8)] bg-background group/calendar [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      formatters={formatters}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none z-30", // Ensure buttons z-index above caption if needed?
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none z-30",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-2 z-20",
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "cn-calendar-caption-label rounded-(--cell-radius) flex items-center gap-1 text-sm  [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-(--cell-radius) flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative w-full rounded-(--cell-radius) h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius) group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-(--cell-radius) bg-muted relative after:bg-muted after:absolute after:inset-y-0 after:w-4 after:right-0 -z-0 isolate",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "rounded-r-(--cell-radius) bg-muted relative after:bg-muted-200 after:absolute after:inset-y-0 after:w-4 after:left-0 -z-0 isolate",
          defaultClassNames.range_end,
        ),
        today: cn(
          "bg-muted text-foreground rounded-(--cell-radius) data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <IconChevronLeft className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <IconChevronRight
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <IconChevronDown className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        MonthCaption: HebrewCaption,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-foreground relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { HebrewCalendar, CalendarDayButton };
