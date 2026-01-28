import * as React from "react";
import { IconCalendar } from "@tabler/icons-react";
import { format, parse, isValid } from "date-fns";
import { HDate, gematriya } from "@hebcal/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { HebrewCalendar } from "@/components/ui/hebrew-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DateInputProps {
  value?: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  /** Maximum selectable date (default: today) */
  maxDate?: Date;
  /** Minimum selectable date */
  minDate?: Date;
}

export function DateInput({
  value,
  onChange,
  disabled,
  maxDate,
  minDate,
}: DateInputProps) {
  const [mode, setMode] = React.useState<"gregorian" | "hebrew">("gregorian");
  const [isOpen, setIsOpen] = React.useState(false);

  // Default maxDate to today
  const effectiveMaxDate = maxDate ?? new Date();

  // Parse current value
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  // Format display text based on mode
  const displayText = React.useMemo(() => {
    if (!dateValue) return null;

    if (mode === "hebrew") {
      const hd = new HDate(dateValue);
      const monthName = dateValue.toLocaleString("he-IL", {
        calendar: "hebrew",
        month: "long",
      });
      return `${gematriya(hd.getDate())} ${monthName} ${gematriya(hd.getFullYear())}`;
    } else {
      return format(dateValue, "dd/MM/yyyy");
    }
  }, [dateValue, mode]);

  // Calculate Hebrew year range for HebrewCalendar
  const currentHYear = React.useMemo(() => new HDate().getFullYear(), []);

  // Calculate Gregorian year range
  const gregStartYear = minDate
    ? minDate.getFullYear()
    : new Date().getFullYear() - 100;
  const gregEndYear = effectiveMaxDate.getFullYear();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-right font-normal",
            !value && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <IconCalendar className="ml-2 h-4 w-4 shrink-0" />
          {displayText ? displayText : <span>בחר תאריך...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "gregorian" | "hebrew")}
          className="w-full min-w-[280px] max-w-[300px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gregorian">לועזי</TabsTrigger>
            <TabsTrigger value="hebrew">עברי</TabsTrigger>
          </TabsList>

          <TabsContent value="gregorian" className="p-0">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              defaultMonth={dateValue}
              toDate={effectiveMaxDate}
              fromDate={minDate}
              startYear={gregStartYear}
              endYear={gregEndYear}
            />
          </TabsContent>

          <TabsContent value="hebrew" className="p-0">
            <div className="text-xs text-muted-foreground px-3 pt-2 pb-1 text-center">
              הגריד מבוסס על מבנה לועזי, התאריכים העבריים אינם מדויקים
            </div>
            <HebrewCalendar
              mode="single"
              selected={dateValue}
              autoFocus
              onSelect={handleDateSelect}
              defaultMonth={dateValue}
              endYear={currentHYear}
              startYear={currentHYear - 120}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
