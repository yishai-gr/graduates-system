"use client";

import * as React from "react";
import { IconCalendar } from "@tabler/icons-react";
import { HDate, gematriya } from "@hebcal/core";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HebrewCalendar } from "@/components/ui/hebrew-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function HebrewDatePickerDemo() {
  const [date, setDate] = React.useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          {date ? (
            (() => {
              const hdate = new HDate(date);
              const monthName = date.toLocaleString("he-IL", {
                calendar: "hebrew",
                month: "long",
              });
              return `${gematriya(hdate.getDate())} ב${monthName} ${gematriya(hdate.getFullYear())}`;
            })()
          ) : (
            <span>בחר תאריך עברי</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <HebrewCalendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
