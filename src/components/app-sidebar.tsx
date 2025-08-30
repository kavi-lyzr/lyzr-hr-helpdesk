
'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Ticket, Users, FileText, Settings, ChevronDown, Plus, ChevronsLeft, ChevronsRight, Building } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: Bot,
    href: '/dashboard/ai-assistant',
  },
  {
    id: 'tickets',
    label: 'Tickets',
    icon: Ticket,
    href: '/dashboard/tickets',
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Users,
    href: '/dashboard/organization',
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    icon: FileText,
    href: '/dashboard/knowledge-base',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`hidden lg:flex lg:flex-col border-r bg-muted/40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 border-b flex items-center px-4 justify-between">
            {!isCollapsed && <div className="font-bold text-xl">Lyzr</div>}
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronsRight /> : <ChevronsLeft />}
            </Button>
        </div>
      <div className="h-16 border-b flex items-center px-4">
        {!isCollapsed ? (
            <Select>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="lyzr-corp">Lyzr Corp</SelectItem>
                <SelectItem value="payu">PayU</SelectItem>
                <div className="border-t my-1" />
                <Button variant="ghost" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
                </Button>
            </SelectContent>
            </Select>
        ) : (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Building className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Select Organization</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )}
      </div>
      <nav className="flex-1 space-y-2 px-2 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={item.href}>
                                <Button
                                variant={pathname.startsWith(item.href) ? "default" : "ghost"}
                                className={`w-full flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                                >
                                <item.icon className={`h-5 w-5 ${!isCollapsed && 'mr-3'}`} />
                                {!isCollapsed && item.label}
                                </Button>
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right"><p>{item.label}</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
