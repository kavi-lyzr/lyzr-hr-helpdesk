import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building, User } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

const organizations = [
  {
    id: 1,
    name: "Lyzr Corp",
    role: "Admin",
  },
  {
    id: 2,
    name: "PayU",
    role: "Employee",
  },
  {
    id: 3,
    name: "Startup Inc.",
    role: "Manager",
  },
  {
    id: 4,
    name: "MegaCorp",
    role: "Resolver",
  },
];

export default function OrganizationsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl">Lyzr</div>
        <ThemeSwitcher />
      </header>
      <main className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Your Organizations</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <a href="/dashboard" key={org.id}>
                <Card className="hover:shadow-lg transition-shadow duration-300 animate-fade-in-up">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Building className="h-8 w-8 text-primary" />
                    <CardTitle>{org.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-4 w-4" />
                        <span>Your role: {org.role}</span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
            <Card className="flex items-center justify-center border-dashed border-2 hover:border-primary transition-colors duration-300">
                <Button variant="ghost" className="w-full h-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}