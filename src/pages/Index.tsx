import { Link } from "react-router-dom";
import { Fish, ArrowRight, FileText, CheckSquare, Link2, Shield, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "File Management",
    description: "Upload, organize, and share files securely with your team",
    color: "text-module-file",
  },
  {
    icon: CheckSquare,
    title: "Task Tracking",
    description: "Create, assign, and track tasks with powerful Kanban boards",
    color: "text-module-task",
  },
  {
    icon: Link2,
    title: "Link Bookmarks",
    description: "Save and categorize your important links for quick access",
    color: "text-module-link",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted and protected with enterprise security",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed with instant search and real-time updates",
    color: "text-chart-4",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with shared workspaces",
    color: "text-secondary",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <nav className="relative container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
              <Fish className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Nemo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>

        <div className="relative container mx-auto px-4 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Your productivity workflow, simplified</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
            Manage files, tasks, and links in{" "}
            <span className="text-primary">one place</span>
          </h1>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nemo is your all-in-one productivity platform. Organize files, track tasks, 
            save bookmarks, and collaborate with your team effortlessly.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Sign in to your account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground">
            Everything you need to stay productive
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your workflow and boost team collaboration
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-gradient-to-br from-primary/10 via-accent to-secondary/10 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of teams using Nemo to manage their work more effectively.
            </p>
            <Link to="/register">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Create your free account
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <Fish className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Nemo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Nemo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
