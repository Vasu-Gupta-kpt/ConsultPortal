"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CaseRow, Difficulty, CaseType } from "@/lib/types";

export type CaseListItem = CaseRow & { solvedCount: number; isSolved: boolean };

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const caseTypes: CaseType[] = [
  "Guesstimate",
  "Profitability",
  "Market Entry",
  "M&A",
  "Operations",
  "Pricing",
  "Growth Strategy",
  "Cost Reduction",
];
const industries = [
  "Healthcare",
  "Technology",
  "Finance",
  "Retail",
  "Manufacturing",
  "FMCG",
  "Education",
  "Telecom",
];
const companies = ["McKinsey", "BCG", "Bain", "Deloitte", "AT Kearney", "Oliver Wyman", "EY", "KPMG"];

const difficultyColors: Record<Difficulty, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

export default function CasesBrowser({ cases }: { cases: CaseListItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<CaseType[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedDifficulties.length && !selectedDifficulties.includes(c.difficulty)) return false;
      if (selectedTypes.length && !selectedTypes.includes(c.type)) return false;
      if (selectedIndustries.length && !selectedIndustries.includes(c.industry)) return false;
      if (selectedCompanies.length && !selectedCompanies.includes(c.company)) return false;
      return true;
    });
  }, [cases, search, selectedDifficulties, selectedTypes, selectedIndustries, selectedCompanies]);

  const activeFiltersCount =
    selectedDifficulties.length +
    selectedTypes.length +
    selectedIndustries.length +
    selectedCompanies.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Case Library</h1>
        <p className="text-muted-foreground text-sm">
          {filtered.length} of {cases.length} cases
        </p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className={cn("gap-2", activeFiltersCount > 0 && "border-primary text-primary")}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 hidden md:block">
            <Card>
              <CardContent className="p-4 space-y-5">
                <FilterSection
                  title="Difficulty"
                  items={difficulties}
                  selected={selectedDifficulties}
                  onToggle={(v) => setSelectedDifficulties(toggle(selectedDifficulties, v as Difficulty))}
                  getClass={(v) => (selectedDifficulties.includes(v as Difficulty) ? difficultyColors[v as Difficulty] : "")}
                />
                <Separator />
                <FilterSection
                  title="Type"
                  items={caseTypes}
                  selected={selectedTypes}
                  onToggle={(v) => setSelectedTypes(toggle(selectedTypes, v as CaseType))}
                />
                <Separator />
                <FilterSection
                  title="Industry"
                  items={industries}
                  selected={selectedIndustries}
                  onToggle={(v) => setSelectedIndustries(toggle(selectedIndustries, v))}
                />
                <Separator />
                <FilterSection
                  title="Company"
                  items={companies}
                  selected={selectedCompanies}
                  onToggle={(v) => setSelectedCompanies(toggle(selectedCompanies, v))}
                />
                {activeFiltersCount > 0 && (
                  <>
                    <Separator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setSelectedDifficulties([]);
                        setSelectedTypes([]);
                        setSelectedIndustries([]);
                        setSelectedCompanies([]);
                      }}
                    >
                      Clear all filters
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Cases list */}
        <div className="flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No cases match your filters.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <Link key={c.id} href={`/cases/${c.id}`}>
                <Card className="card-hover border-border cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {c.isSolved ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-medium text-sm leading-snug">{c.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn("text-xs flex-shrink-0", difficultyColors[c.difficulty])}
                          >
                            {c.difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {c.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {c.industry}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {c.estimated_time}m
                          </span>
                          <span>{c.solvedCount} solved</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  items,
  selected,
  onToggle,
  getClass,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
  getClass?: (v: string) => string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={cn(
              "text-xs px-2 py-1 rounded border transition-colors",
              selected.includes(item)
                ? getClass?.(item) || "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
