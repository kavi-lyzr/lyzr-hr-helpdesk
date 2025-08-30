"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building, User, Loader2, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/lib/AuthProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Organization {
  _id: string;
  name: string;
  role: string;
  avatar?: string;
  joinedAt: Date;
}

export default function OrganizationsPage() {
  const { isAuthenticated, isLoading, userId, logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    systemInstruction: ""
  });
  const router = useRouter();

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user's organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/user/organizations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        } else {
          console.error('Failed to load organizations');
          setOrganizations([]);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };

    if (userId) {
      loadOrganizations();
    }
  }, [userId]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !createForm.name.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          systemInstruction: createForm.systemInstruction.trim() || undefined,
          createdBy: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new organization to the list
        setOrganizations([
          ...organizations,
          {
            _id: data.organization._id,
            name: data.organization.name,
            role: 'admin',
            joinedAt: new Date(),
          }
        ]);
        setCreateDialogOpen(false);
        setCreateForm({ name: "", systemInstruction: "" });
      } else {
        const error = await response.json();
        alert(`Failed to create organization: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOrganizationSelect = (orgId: string) => {
    // Update user's current organization and navigate to dashboard
    router.push(`/dashboard?org=${orgId}`);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl">Lyzr</div>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Your Organizations</h1>
          
          {loadingOrgs ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading organizations...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <Card 
                  key={org._id} 
                  className="hover:shadow-lg transition-shadow duration-300 animate-fade-in-up cursor-pointer"
                  onClick={() => handleOrganizationSelect(org._id)}
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Building className="h-8 w-8 text-primary" />
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="mr-2 h-4 w-4" />
                      <span>Your role: {org.role}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="flex items-center justify-center border-dashed border-2 hover:border-primary transition-colors duration-300 cursor-pointer">
                    <Button variant="ghost" className="w-full h-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        placeholder="Enter organization name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="system-instruction">System Instruction (Optional)</Label>
                      <Textarea
                        id="system-instruction"
                        placeholder="Customize how the AI assistant should behave for this organization"
                        value={createForm.systemInstruction}
                        onChange={(e) => setCreateForm({ ...createForm, systemInstruction: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating || !createForm.name.trim()}>
                        {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {!loadingOrgs && organizations.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <Building className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No organizations yet</h3>
                <p className="text-muted-foreground">Create your first organization to get started</p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        placeholder="Enter organization name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="system-instruction">System Instruction (Optional)</Label>
                      <Textarea
                        id="system-instruction"
                        placeholder="Customize how the AI assistant should behave for this organization"
                        value={createForm.systemInstruction}
                        onChange={(e) => setCreateForm({ ...createForm, systemInstruction: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating || !createForm.name.trim()}>
                        {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}