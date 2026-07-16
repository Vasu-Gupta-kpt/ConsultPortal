import Link from "next/link";
import { BookOpen, Users, TrendingUp, Award, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Cases", value: "120+" },
  { label: "Active Students", value: "245" },
  { label: "Practice Sessions", value: "1,800+" },
  { label: "Placements", value: "MBB & Big 4" },
];

const features = [
  {
    icon: BookOpen,
    title: "Case Library",
    description:
      "Structured cases tagged by difficulty, type, industry, company, and framework. Solve, track progress, and share your approach.",
    href: "/cases",
    cta: "Browse Cases",
    highlights: [
      "Guesstimate, Profitability, Market Entry & more",
      "Filter by MBB, Bain, Big 4",
      "LeetCode-style progress tracking",
    ],
    badge: "120+ Cases",
  },
  {
    icon: GraduationCap,
    title: "Learning Materials",
    description:
      "Industry notes, frameworks, casebooks, and consulting skill guides curated by placed seniors and the club.",
    href: "/materials",
    cta: "View Materials",
    highlights: [
      "Official IIMC Casebook 2024",
      "Framework guides & industry notes",
      "Video walkthroughs",
    ],
    badge: "50+ Resources",
  },
  {
    icon: Users,
    title: "Peer Practice",
    description:
      "Find batchmates and seniors on campus for mock interviews. Filter by year, specialization, and book available time slots.",
    href: "/peer-practice",
    cta: "Find Partners",
    highlights: [
      "Filter by year & expertise",
      "Book available slots instantly",
      "Rate & review sessions",
    ],
    badge: "Book Mocks",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient text-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.jpeg" alt="IIM Calcutta Consult Club" width={140} height={140} className="drop-shadow-lg" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Your Consulting
            <br />
            Prep Platform
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
            Practice cases, learn from seniors, and book mock interviews — everything you need to
            crack MBB and Big 4 interviews, all in one place.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/cases"
              className={cn(buttonVariants({ size: "lg" }), "bg-white text-primary hover:bg-white/90 font-semibold")}
            >
              Start Practicing
            </Link>
            <Link
              href="/peer-practice"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 text-white bg-white/10 hover:bg-white/20")}
            >
              Find a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center px-4 py-2">
                <p className="text-xl md:text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything You Need to Prep</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A structured, community-driven platform built by students, for students.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, href, cta, highlights, badge }) => (
            <Card key={title} className="card-hover border-border flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1">{description}</p>
                <ul className="space-y-1.5 mb-5">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{h}</span>
                    </li>
                  ))}
                </ul>
                <Link href={href} className={cn(buttonVariants(), "w-full gap-1.5")}>
                  {cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dashboard CTA */}
      <section className="bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Track Your Progress</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">See How You Stack Up</h2>
            <p className="text-muted-foreground max-w-md">
              Your personal dashboard shows solved cases by difficulty, streaks, and your standing
              among the batch — just like LeetCode, built for consulting.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Rankings</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Streaks</p>
            </div>
            <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
              View Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
