"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Building2,
  ThumbsUp,
  MessageSquare,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { CaseCommentRow, CaseRow, ConversationTurn, Difficulty, FrameworkNode } from "@/lib/types";
import { postApproach, toggleCaseSolved, toggleUpvote } from "@/lib/actions/cases";

export type CommentItem = CaseCommentRow & { upvotes: number; isUpvoted: boolean };

const difficultyColors: Record<Difficulty, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

export default function CaseDetailView({
  caseData,
  comments: initialComments,
  isSolved: initialIsSolved,
  solvedCount,
}: {
  caseData: CaseRow;
  comments: CommentItem[];
  isSolved: boolean;
  solvedCount: number;
}) {
  const [isSolved, setIsSolved] = useState(initialIsSolved);
  const [comments, setComments] = useState(initialComments);
  const [newApproach, setNewApproach] = useState("");
  const [newContent, setNewContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggleSolved() {
    const optimistic = !isSolved;
    setIsSolved(optimistic);
    startTransition(async () => {
      try {
        const { isSolved: confirmed } = await toggleCaseSolved(caseData.id);
        setIsSolved(confirmed);
      } catch {
        setIsSolved(!optimistic);
      }
    });
  }

  function handlePostApproach() {
    setFormError(null);
    startTransition(async () => {
      const result = await postApproach(caseData.id, newApproach, newContent);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setComments((prev) => [{ ...result.comment, upvotes: 0, isUpvoted: false }, ...prev]);
      setNewApproach("");
      setNewContent("");
    });
  }

  function handleToggleUpvote(commentId: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, isUpvoted: !c.isUpvoted, upvotes: c.upvotes + (c.isUpvoted ? -1 : 1) }
          : c
      )
    );
    startTransition(async () => {
      try {
        await toggleUpvote(commentId, caseData.id);
      } catch {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, isUpvoted: !c.isUpvoted, upvotes: c.upvotes + (c.isUpvoted ? -1 : 1) }
              : c
          )
        );
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cases
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title + badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className={cn("text-xs", difficultyColors[caseData.difficulty])}>
                {caseData.difficulty}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {caseData.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {caseData.industry}
              </Badge>
            </div>
            <h1 className="text-xl font-bold">{caseData.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {caseData.company}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {caseData.estimated_time} min
              </span>
              <span>{solvedCount} solved</span>
            </div>
          </div>

          <Tabs defaultValue="case">
            <TabsList>
              <TabsTrigger value="case">Case</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="approaches">
                Approaches
                <span className="ml-1.5 bg-primary/10 text-primary text-xs rounded-full px-1.5">
                  {comments.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="case" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Case Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">{caseData.description}</p>
                </CardContent>
              </Card>

              {/* Mark solved */}
              <Button onClick={handleToggleSolved} variant={isSolved ? "outline" : "default"} className="w-full gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {isSolved ? "Mark as Unsolved" : "Mark as Solved"}
              </Button>
            </TabsContent>

            <TabsContent value="conversation" className="mt-4">
              <ConversationView turns={caseData.conversation} />
            </TabsContent>

            <TabsContent value="structure" className="mt-4">
              <StructureView caseData={caseData} />
            </TabsContent>

            <TabsContent value="approaches" className="mt-4 space-y-4">
              {/* Add approach */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium">Share Your Approach</p>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Approach title (e.g. Top-down profitability tree)"
                    value={newApproach}
                    onChange={(e) => setNewApproach(e.target.value)}
                  />
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    rows={4}
                    placeholder="Describe your approach, key insights, and what worked..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                  {formError && <p className="text-sm text-destructive">{formError}</p>}
                  <Button
                    size="sm"
                    disabled={!newApproach || !newContent}
                    onClick={handlePostApproach}
                  >
                    Post Approach
                  </Button>
                </CardContent>
              </Card>

              {/* Existing comments */}
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No approaches shared yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {comment.author_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{comment.author_name}</span>
                            {comment.author_year && (
                              <Badge variant="outline" className="text-xs">
                                Year {comment.author_year}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {comment.created_at.slice(0, 10)}
                            </span>
                          </div>
                          <p className="text-xs text-primary font-medium mb-1.5 bg-primary/5 rounded px-2 py-0.5 inline-block">
                            {comment.approach_title}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {comment.content}
                          </p>
                          <button
                            onClick={() => handleToggleUpvote(comment.id)}
                            className={cn(
                              "flex items-center gap-1 mt-2 text-xs transition-colors",
                              comment.isUpvoted
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"
                            )}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {comment.upvotes} helpful
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Case Details
              </p>
              <DetailRow label="Difficulty" value={caseData.difficulty} />
              <Separator />
              <DetailRow label="Type" value={caseData.type} />
              <Separator />
              <DetailRow label="Industry" value={caseData.industry} />
              <Separator />
              <DetailRow label="Company" value={caseData.company} />
              <Separator />
              <DetailRow label="Est. Time" value={`${caseData.estimated_time} min`} />
              {caseData.casebook && (
                <>
                  <Separator />
                  <DetailRow label="Casebook" value={caseData.casebook} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {caseData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ConversationView({ turns }: { turns: ConversationTurn[] }) {
  if (turns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No scripted conversation for this case yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {turns.map((turn, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg px-4 py-3 text-sm leading-relaxed max-w-[85%]",
            turn.speaker === "interviewer"
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-xs font-semibold mb-1 opacity-70 capitalize">{turn.speaker}</p>
          {turn.text}
        </div>
      ))}
    </div>
  );
}

// Horizontal box-and-line org chart, matching the source casebook's layout
// (branch nodes as solid boxes -- red if explored, gray if not; leaf detail
// nodes as small outlined chips when explored). Connector lines are drawn
// by the .framework-org-chart CSS in globals.css using the classic nested
// <ul>/<li> technique -- no charting library needed.
function FrameworkTreeView({ node }: { node: FrameworkNode }) {
  return (
    <div className="overflow-x-auto py-2">
      <ul className="framework-org-chart min-w-max">
        <FrameworkTreeNode node={node} />
      </ul>
    </div>
  );
}

function FrameworkTreeNode({ node }: { node: FrameworkNode }) {
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <li>
      {node.label && (
        <div
          className={cn(
            "max-w-[140px] rounded-md text-center leading-snug",
            hasChildren
              ? cn(
                  "px-3 py-2 text-xs font-medium",
                  node.explored ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )
              : cn(
                  "px-2.5 py-1.5 text-xs",
                  node.explored
                    ? "border-2 border-primary bg-background text-foreground"
                    : "bg-muted text-muted-foreground"
                )
          )}
        >
          {node.label}
        </div>
      )}
      {hasChildren && (
        <ul>
          {node.children!.map((child, i) => (
            <FrameworkTreeNode key={i} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
          <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function StructureView({ caseData }: { caseData: CaseRow }) {
  const hasFacts = caseData.case_facts.length > 0 || caseData.additional_info.length > 0;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {hasFacts && (
        <div className="lg:col-span-1 space-y-4">
          {caseData.case_facts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Case Facts</CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={caseData.case_facts} />
              </CardContent>
            </Card>
          )}
          {caseData.additional_info.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <BulletList items={caseData.additional_info} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className={cn("space-y-4", hasFacts ? "lg:col-span-2" : "lg:col-span-3")}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Structure / Framework</CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.framework_tree ? (
              <FrameworkTreeView node={caseData.framework_tree} />
            ) : caseData.framework.length > 0 ? (
              <div className="space-y-1.5">
                {caseData.framework.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No framework added for this case yet.</p>
            )}
          </CardContent>
        </Card>

        {caseData.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={caseData.recommendations} />
            </CardContent>
          </Card>
        )}

        {caseData.tips.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tips / Tricks</CardTitle>
            </CardHeader>
            <CardContent>
              <BulletList items={caseData.tips} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
