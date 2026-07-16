import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Flame, Trophy, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import type { CaseRow, Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

const difficultyColors: Record<Difficulty, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

const difficultyProgressColors: Record<Difficulty, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-red-500",
};

type SolveWithCase = {
  solved_at: string;
  case: Pick<CaseRow, "id" | "title" | "type" | "industry" | "difficulty" | "estimated_time"> | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, { data: allCases }, { data: mySolves }, { data: leaderboardRows }, { data: streak }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, year").eq("id", user.id).single(),
      supabase.from("cases").select("id, difficulty"),
      supabase
        .from("case_solves")
        .select("solved_at, case:cases(id, title, type, industry, difficulty, estimated_time)")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false }),
      supabase.rpc("leaderboard"),
      supabase.rpc("calculate_streak"),
    ]);

  const ownLeaderboardRow = (leaderboardRows ?? []).find(
    (row: { user_id: string }) => row.user_id === user.id
  );

  const totalCases = (allCases ?? []).length;
  const totalByDifficulty: Record<Difficulty, number> = {
    Easy: (allCases ?? []).filter((c) => c.difficulty === "Easy").length,
    Medium: (allCases ?? []).filter((c) => c.difficulty === "Medium").length,
    Hard: (allCases ?? []).filter((c) => c.difficulty === "Hard").length,
  };

  const solves = (mySolves ?? []) as unknown as SolveWithCase[];
  const solvedCases = solves.filter((s) => s.case !== null).map((s) => s.case as NonNullable<SolveWithCase["case"]>);

  const totalSolved = ownLeaderboardRow ? Number(ownLeaderboardRow.total_solved) : solvedCases.length;
  const easySolved = solvedCases.filter((c) => c.difficulty === "Easy").length;
  const mediumSolved = solvedCases.filter((c) => c.difficulty === "Medium").length;
  const hardSolved = solvedCases.filter((c) => c.difficulty === "Hard").length;
  const rank = ownLeaderboardRow ? Number(ownLeaderboardRow.rank) : 0;
  const totalStudents = ownLeaderboardRow ? Number(ownLeaderboardRow.total_students) : 0;
  const overallPct = totalCases > 0 ? Math.round((totalSolved / totalCases) * 100) : 0;

  const solvedDates = new Set(solves.map((s) => s.solved_at.slice(0, 10)));
  const heatmap = Array.from({ length: 35 }).map((_, i) => {
    const daysAgo = 34 - i;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return solvedDates.has(date.toISOString().slice(0, 10));
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-0.5">My Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {profile?.full_name ?? user.email} &bull; PGP Year {profile?.year}
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          value={totalSolved}
          label="Cases Solved"
          sub={`of ${totalCases} total`}
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          value={streak ?? 0}
          label="Day Streak"
          sub="Keep it going!"
          valueClass="text-orange-500"
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
          value={`#${rank}`}
          label="Batch Rank"
          sub={`out of ${totalStudents}`}
          valueClass="text-amber-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          value={`${overallPct}%`}
          label="Completion"
          sub="Overall progress"
          valueClass="text-emerald-500"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Progress by difficulty */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progress by Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => {
              const solved =
                diff === "Easy" ? easySolved : diff === "Medium" ? mediumSolved : hardSolved;
              const total = totalByDifficulty[diff];
              const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
              return (
                <div key={diff}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", difficultyColors[diff])}>
                        {diff}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {solved}
                      <span className="text-muted-foreground font-normal"> / {total}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", difficultyProgressColors[diff])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <Separator />

            {/* Overall bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall</span>
                <span className="text-sm font-medium">
                  {totalSolved}
                  <span className="text-muted-foreground font-normal"> / {totalCases}</span>
                </span>
              </div>
              <Progress value={overallPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Activity heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {heatmap.map((active, i) => (
                <div
                  key={i}
                  className={cn("h-5 w-full rounded-sm", active ? "bg-primary/70" : "bg-muted")}
                  title={active ? "Solved a case" : ""}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Last 5 weeks</p>
            <Separator className="my-3" />
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{streak ?? 0}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solved cases */}
      <Card className="mt-6">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recently Solved</CardTitle>
          <Link href="/cases" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs gap-1")}>
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {solvedCases.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">
              No cases solved yet. Head to the Case Library to get started.
            </p>
          ) : (
            solvedCases.map((c, i) => (
              <div key={c.id}>
                {i > 0 && <Separator />}
                <Link href={`/cases/${c.id}`}>
                  <div className="flex items-center gap-3 px-6 py-3 hover:bg-accent/50 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.type} &bull; {c.industry}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={cn("text-xs", difficultyColors[c.difficulty])}>
                        {c.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.estimated_time}m
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">{icon}</div>
        <p className={cn("text-2xl font-bold", valueClass)}>{value}</p>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}
