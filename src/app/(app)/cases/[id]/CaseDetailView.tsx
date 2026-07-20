"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Building2,
  ThumbsUp,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn, getPublicStorageUrl } from "@/lib/utils";
import type {
  CaseCommentRow,
  CaseRow,
  CaseStructure,
  ConversationTurn,
  Difficulty,
  FrameworkNode,
} from "@/lib/types";
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

// Horizontal box-and-line org chart. Connector lines are drawn by the
// .framework-org-chart CSS in globals.css using the classic nested <ul>/<li>
// technique -- no charting library needed. The technique only works
// reliably when every box is the same size, so every node here (root
// included) shares one fixed dimension and one two-state color rule
// (explored vs not) -- and critically, the ROOT box is rendered *outside*
// the <li> connector system entirely (only its children are wrapped in
// `.framework-org-chart`), so there's nothing above the root for a stray
// line to attach to.
type TreeSize = "sm" | "lg";

function FrameworkBox({ node, size }: { node: FrameworkNode; size: TreeSize }) {
  if (!node.label) return null;
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md",
        size === "lg" ? "h-24 w-52 px-4" : "h-14 w-32 px-2",
        node.explored
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground border border-border"
      )}
    >
      {/* line-clamp sets display:-webkit-box, which would otherwise clobber
          the parent's flex centering if applied on the same element. */}
      <span
        className={cn(
          "line-clamp-3 text-center font-medium leading-snug",
          size === "lg" ? "text-base" : "text-xs"
        )}
      >
        {node.label}
      </span>
    </div>
  );
}

function FrameworkTreeNode({ node, size }: { node: FrameworkNode; size: TreeSize }) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  return (
    <li>
      <FrameworkBox node={node} size={size} />
      {hasChildren && (
        <ul>
          {node.children!.map((child, i) => (
            <FrameworkTreeNode key={i} node={child} size={size} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FrameworkTreeView({ node, size = "sm" }: { node: FrameworkNode; size?: TreeSize }) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  return (
    <div className="overflow-x-auto py-2">
      <div className="flex min-w-max flex-col items-center">
        <FrameworkBox node={node} size={size} />
        {hasChildren && (
          <ul className="framework-org-chart">
            {node.children!.map((child, i) => (
              <FrameworkTreeNode key={i} node={child} size={size} />
            ))}
          </ul>
        )}
      </div>
    </div>
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

function StructureContent({ structure, size = "sm" }: { structure: CaseStructure; size?: TreeSize }) {
  if (structure.tree) {
    return <FrameworkTreeView node={structure.tree} size={size} />;
  }
  if (structure.image_path) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image from Supabase Storage, not a local asset
      <img
        src={getPublicStorageUrl("case-structures", structure.image_path)}
        alt={structure.title ?? "Case structure diagram"}
        // In "lg" (zoomed modal) mode, FitToContainer scales this to fit --
        // no width cap needed, letting it measure/render at natural size.
        className={cn("rounded-md", size === "sm" && "max-w-full")}
      />
    );
  }
  return null;
}

// Scales its children down (or up) via a CSS transform so the whole thing
// always fits within the available space, with no scrolling -- used for the
// structure zoom modal, where the diagram should always be fully visible
// regardless of how large or wide it naturally is. Measures the content's
// true natural size via scrollWidth/scrollHeight (unaffected by the
// transform itself, since CSS transforms don't change layout size) and
// recomputes on resize via ResizeObserver.
function FitToContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    function recompute() {
      const containerWidth = container!.clientWidth;
      const containerHeight = container!.clientHeight;
      const contentWidth = content!.scrollWidth;
      const contentHeight = content!.scrollHeight;
      if (!containerWidth || !containerHeight || !contentWidth || !contentHeight) return;
      setScale(Math.min(containerWidth / contentWidth, containerHeight / contentHeight));
    }

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className={cn("flex items-center justify-center overflow-hidden", className)}>
      <div ref={contentRef} className="w-max" style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children}
      </div>
    </div>
  );
}

function StructureCard({ structure, index, total }: { structure: CaseStructure; index: number; total: number }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const title = structure.title || (total > 1 ? `Structure ${index + 1}` : "Structure / Framework");

  return (
    <Card>
      <CardHeader className="pb-2 flex items-center justify-between space-y-0">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Button size="icon-sm" variant="ghost" onClick={() => setZoomOpen(true)} title="Zoom in">
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent>
        <StructureContent structure={structure} />
      </CardContent>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="w-[98vw] h-[95vh] max-w-[98vw] sm:max-w-[98vw] max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <FitToContainer className="min-h-0 flex-1">
            <StructureContent structure={structure} size="lg" />
          </FitToContainer>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StructureView({ caseData }: { caseData: CaseRow }) {
  const hasFacts = caseData.case_facts.length > 0 || caseData.additional_info.length > 0;
  const hasStructures = caseData.structures.length > 0;

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
        {hasStructures ? (
          caseData.structures.map((structure, i) => (
            <StructureCard key={i} structure={structure} index={i} total={caseData.structures.length} />
          ))
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Structure / Framework</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.framework.length > 0 ? (
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
        )}

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
