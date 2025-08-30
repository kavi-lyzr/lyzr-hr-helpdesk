
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landingPageContent } from "@/lib/config";
import { Github, Linkedin, Twitter } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="font-bold text-xl">Lyzr</div>
        <nav className="hidden md:flex gap-6 items-center">
          <a href="#features" className="text-sm font-medium hover:underline">Features</a>
          <a href="#demo" className="text-sm font-medium hover:underline">Demo</a>
          <a href="#testimonials" className="text-sm font-medium hover:underline">Testimonials</a>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
                <a href="#">{landingPageContent.secondaryAction}</a>
            </Button>
            <Button asChild>
                <a href="/organizations">{landingPageContent.mainAction}</a>
            </Button>
            <ThemeSwitcher />
            <a href="https://github.com/lyzr-ai/hr-helpdesk" target="_blank" rel="noreferrer">
                <Github className="h-6 w-6" />
            </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex items-center justify-center text-center py-20 md:py-32">
            <div className="container">
                <h1 className="text-4xl md:text-6xl font-bold animate-fade-in-down">{landingPageContent.title}</h1>
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto animate-fade-in-up">{landingPageContent.description}</p>
                <div className="flex justify-center gap-4 mt-8">
                <Button asChild size="lg">
                    <a href="/organizations">{landingPageContent.mainAction}</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                    <a href="#">{landingPageContent.secondaryAction}</a>
                </Button>
                </div>
            </div>
        </section>

        <section id="features" className="py-20 md:py-32 bg-muted/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center">Features</h2>
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                    <Card className="animate-fade-in-up">
                        <CardHeader><CardTitle>AI-Powered Assistant</CardTitle></CardHeader>
                        <CardContent>Provides instant answers to HR questions, reducing the load on your HR team.</CardContent>
                    </Card>
                    <Card className="animate-fade-in-up delay-200">
                        <CardHeader><CardTitle>Smart Ticket Routing</CardTitle></CardHeader>
                        <CardContent>Automatically assigns tickets to the right person or department.</CardContent>
                    </Card>
                    <Card className="animate-fade-in-up delay-400">
                        <CardHeader><CardTitle>Knowledge Base</CardTitle></CardHeader>
                        <CardContent>A central place for all your HR documents and policies.</CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="demo" className="py-20 md:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center">See it in action</h2>
                <div className="mt-12 aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Demo video coming soon</p>
                </div>
            </div>
        </section>

        <section id="testimonials" className="py-20 md:py-32 bg-muted/40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center">What our customers say</h2>
                <div className="grid md:grid-cols-2 gap-8 mt-12">
                    <Card>
                        <CardContent className="pt-6">
                            <p>"Lyzr HR Helpdesk has transformed our HR processes. Our employees get instant answers, and our HR team can focus on more strategic tasks."</p>
                            <p className="font-bold mt-4">- CEO, PayU</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p>"The smart ticket routing is a game-changer. It has significantly reduced the time it takes to resolve employee queries."</p>
                            <p className="font-bold mt-4">- HR Manager, Lyzr</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

      </main>

      <footer className="py-8 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Lyzr. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#"><Twitter className="h-6 w-6" /></a>
                <a href="#"><Linkedin className="h-6 w-6" /></a>
                <a href="https://github.com/lyzr-ai/hr-helpdesk"><Github className="h-6 w-6" /></a>
            </div>
        </div>
      </footer>
    </div>
  );
}
