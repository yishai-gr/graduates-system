import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { IconChevronRight, IconMenu2, IconSchool } from "@tabler/icons-react";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-center border-b bg-background px-4 md:hidden">
      <div className="flex h-16 items-center border-b px-6">
        <IconSchool className="ml-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">מערכת בוגרים</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
          >
            <IconMenu2 className="h-6 w-6" />
            <span className="sr-only">פתח תפריט</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="p-0 w-screen!"
          showCloseButton={false}
        >
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="absolute top-4 left-4"
              size="icon"
            >
              <IconChevronRight className="h-6 w-6" />
              <span className="sr-only">סגור תפריט</span>
            </Button>
          </SheetClose>
          <SheetTitle className="sr-only">תפריט ניווט</SheetTitle>
          <SheetDescription className="sr-only">
            תפריט ניווט ראשי למובייל
          </SheetDescription>
          <AppSidebar
            className="border-none shadow-none w-full h-screen"
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
