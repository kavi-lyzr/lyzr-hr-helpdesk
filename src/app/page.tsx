import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landingPageContent } from "@/lib/config";
import { Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl">Lyzr</div>
        <a href="https://github.com/lyzr-ai/hr-helpdesk" target="_blank" rel="noreferrer">
          <Github className="h-6 w-6" />
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{landingPageContent.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{landingPageContent.description}</p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <a href="/organizations">{landingPageContent.mainAction}</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="#">{landingPageContent.secondaryAction}</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}