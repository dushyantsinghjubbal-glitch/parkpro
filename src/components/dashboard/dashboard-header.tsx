
'use client';

import { useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
import { EntryDialog } from '@/components/entry/entry-dialog';
import { ExitDialog } from '@/components/exit/exit-dialog';

export function DashboardHeader() {
    const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
    const [isExitDialogOpen, setExitDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setEntryDialogOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Car Entry</span>
                <span className="sm:hidden">Entry</span>
            </Button>
            <Button onClick={() => setExitDialogOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Car Exit</span>
                <span className="sm:hidden">Exit</span>
            </Button>
        </div>
      </header>
      <EntryDialog isOpen={isEntryDialogOpen} onOpenChange={setEntryDialogOpen} />
      <ExitDialog isOpen={isExitDialogOpen} onOpenChange={setExitDialogOpen} />
    </>
  );
}

    