
'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";
import AppSidebar from "./app-sidebar";
import { ThemeSwitcher } from "./theme-switcher";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AppSidebar />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <ThemeSwitcher />
          <Button variant="outline" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
