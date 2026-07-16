"use client";

import { useState, useTransition } from "react";
import { Download, Search, FileText, Video, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadMaterial } from "@/lib/actions/materials";
import type { MaterialRow } from "@/lib/types";

export type MaterialListItem = MaterialRow & { downloadCount: number };

const categoryColors: Record<MaterialRow["category"], string> = {
  Framework: "bg-blue-50 text-blue-700 border-blue-200",
  "Industry Note": "bg-purple-50 text-purple-700 border-purple-200",
  Skill: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Casebook: "bg-amber-50 text-amber-700 border-amber-200",
};

const fileTypeIcon: Record<MaterialRow["file_type"], typeof FileText> = {
  PDF: FileText,
  Video: Video,
  Article: BookOpen,
};

export default function MaterialsBrowser({ materials }: { materials: MaterialListItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categories = ["All", "Framework", "Industry Note", "Skill", "Casebook"];

  const filtered = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function handleDownload(materialId: string) {
    setDownloadError(null);
    setDownloadingId(materialId);
    startTransition(async () => {
      const result = await downloadMaterial(materialId);
      setDownloadingId(null);
      if ("error" in result) {
        setDownloadError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Learning Materials</h1>
        <p className="text-muted-foreground text-sm">
          Frameworks, industry notes, casebooks, and skill guides curated by the club.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
        <TabsList>
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {downloadError && <p className="text-sm text-destructive mb-4">{downloadError}</p>}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((material) => {
          const Icon = fileTypeIcon[material.file_type];
          return (
            <Card key={material.id} className="card-hover flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${categoryColors[material.category]}`}
                  >
                    {material.category}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1.5 leading-snug">{material.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 flex-1 leading-relaxed">
                  {material.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {material.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="h-3.5 w-3.5" />
                    {material.downloadCount.toLocaleString()} downloads
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={downloadingId === material.id}
                    onClick={() => handleDownload(material.id)}
                  >
                    <Download className="h-3 w-3" />
                    {downloadingId === material.id
                      ? "..."
                      : material.file_type === "Video"
                        ? "Watch"
                        : "Download"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>No materials found for your search.</p>
        </div>
      )}
    </div>
  );
}
