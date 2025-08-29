'use client';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Ticket, Users, FileText, Settings, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r">
      <div className="h-16 border-b flex items-center px-4">
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
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link href={item.href}>
                <Button
                  variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}