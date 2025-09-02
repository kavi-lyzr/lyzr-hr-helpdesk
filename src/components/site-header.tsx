
'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, Building, Plus, LogOut } from "lucide-react";
import AppSidebar from "./app-sidebar";
import { ThemeSwitcher } from "./theme-switcher";
import { useAuth } from "@/lib/AuthProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Organization {
  _id: string;
  name: string;
  role: string;
  organization?: any;
}

export default function SiteHeader() {
  const { logout, userId, email } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/v1/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
          
          // Set current org from URL params or first org
          const urlParams = new URLSearchParams(window.location.search);
          const orgId = urlParams.get('org');
          
          if (orgId) {
            const org = data.organizations.find((o: Organization) => o._id === orgId);
            if (org) {
              setCurrentOrg(org);
            }
          } else if (data.organizations.length > 0) {
            setCurrentOrg(data.organizations[0]);
          }
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      }
    };

    if (userId) {
      loadOrganizations();
    }
  }, [userId]);

  const handleOrgChange = (orgId: string) => {
    const org = organizations.find(o => o._id === orgId);
    if (org) {
      setCurrentOrg(org);
      // Update URL with org parameter
      const currentPath = window.location.pathname;
      router.push(`${currentPath}?org=${orgId}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="h-16 flex items-center justify-between px-4">
        {/* Left Side - Mobile Menu + Logo */}
        <div className="lg:hidden flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 border-border/50">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AppSidebar />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <Image
              src="/lyzr.svg"
              alt="Lyzr"
              width={20}
              height={20}
              className="rounded"
            />
            <span className="font-semibold text-sm">Lyzr HR</span>
          </div>
        </div>

        {/* Center - Organization Selector */}
        <div className="flex-1 max-w-xs mx-4">
          <Select value={currentOrg?._id || ''} onValueChange={handleOrgChange}>
            <SelectTrigger className="h-9 border-border/50 bg-muted/50">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <SelectValue 
                    placeholder="Select Organization"
                    className="text-sm"
                  />
                </div>
              </div>
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org._id} value={org._id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-sm">
                      {org.name || org.organization?.name}
                    </span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {org.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
              <DropdownMenuSeparator />
              <div className="p-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-8 text-sm"
                  onClick={() => router.push('/organizations')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Manage Organizations
                </Button>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side - Theme + User */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-muted">
                    {email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">
                  {email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentOrg?.role || 'Member'} • {currentOrg?.name || currentOrg?.organization?.name || 'No org'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/settings?org=${currentOrg?._id || ''}`)}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
