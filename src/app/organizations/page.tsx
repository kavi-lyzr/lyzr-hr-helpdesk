
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

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
];

export default function OrganizationsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl">Lyzr</div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-center mb-8">Your Organizations</h1>
          <div className="grid gap-4">
            {organizations.map((org) => (
              <a href="/dashboard" key={org.id}>
                <Card className="hover:bg-muted/80 transition-colors">
                  <CardHeader>
                    <CardTitle>{org.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Your role: {org.role}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
