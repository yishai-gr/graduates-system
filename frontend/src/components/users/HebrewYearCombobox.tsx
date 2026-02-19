import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  ComboboxTrigger,
  ComboboxInput,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { getHebrewYears } from "@/lib/hebrewYears";

interface HebrewYearComboboxProps {
  value?: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  items?: { shiur_year: string; count: number }[] | string[];
}

export function HebrewYearCombobox(props: {
  value: string[];
  onChange: (value: string[]) => void;
  multiple: true;
  items?: { shiur_year: string; count: number }[] | string[];
}): React.JSX.Element;
export function HebrewYearCombobox(props: {
  value?: string;
  onChange: (value: string) => void;
  multiple?: false;
  items?: { shiur_year: string; count: number }[] | string[];
}): React.JSX.Element;
export function HebrewYearCombobox({
  value,
  onChange,
  multiple = false,
  items,
}: HebrewYearComboboxProps) {
  const anchor = useComboboxAnchor();

  const hebrewYears = React.useMemo(() => {
    if (items) {
      if (typeof items[0] === "string")
        return (items as string[]).map((y) => ({
          value: y,
          label: y,
          count: undefined,
        }));
      return (items as { shiur_year: string; count: number }[]).map((y) => ({
        value: y.shiur_year,
        label: y.shiur_year,
        count: y.count,
      }));
    }
    return getHebrewYears(100, 5).map((y) => ({
      value: y.value,
      label: y.value,
      count: undefined,
    }));
  }, [items]);

  if (multiple) {
    const arrayValue = Array.isArray(value) ? value : [];

    return (
      <Combobox
        multiple
        value={arrayValue}
        onValueChange={(val) => onChange(val as string[])}
        items={hebrewYears.map((y) => y.value)}
      >
        <ComboboxChips
          ref={anchor}
          className="w-full flex-wrap gap-1 p-2 bg-background border rounded-md min-h-10"
        >
          <ComboboxValue>
            {(values) => (
              <>
                {Array.isArray(values) &&
                  values.map((item: string) => (
                    <ComboboxChip key={item}>{item}</ComboboxChip>
                  ))}
                <ComboboxChipsInput
                  placeholder={
                    Array.isArray(values) && values.length > 0
                      ? ""
                      : "בחר מחזורים..."
                  }
                  className="flex-1 min-w-[60px] bg-transparent border-0 outline-none ring-0 focus:ring-0"
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="w-(--anchor-width)">
          <ComboboxEmpty>לא נמצאה שנה מתאימה.</ComboboxEmpty>
          <ComboboxList>
            {hebrewYears.map((year) => (
              <ComboboxItem
                key={year.value}
                value={year.value}
                className="justify-between"
              >
                <span>{year.label}</span>
                {year.count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({year.count})
                  </span>
                )}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  }

  return (
    <Combobox
      value={value as string}
      onValueChange={(val) => onChange(val as string)}
      items={hebrewYears.map((y) => y.value)}
    >
      <ComboboxTrigger
        ref={anchor as unknown as React.RefObject<HTMLButtonElement>}
        className="w-full justify-between h-10 px-3 py-2 border rounded-md bg-background text-sm flex items-center"
      >
        <ComboboxValue placeholder="בחר מחזור..." />
      </ComboboxTrigger>
      <ComboboxContent anchor={anchor} className="w-(--anchor-width)">
        <ComboboxInput placeholder="חפש שנה..." className="mb-2" />
        <ComboboxList>
          {hebrewYears.map((year) => (
            <ComboboxItem
              key={year.value}
              value={year.value}
              className="justify-between"
            >
              <span>{year.label}</span>
              {year.count !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({year.count})
                </span>
              )}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
