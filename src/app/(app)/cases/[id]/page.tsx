import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CaseCommentRow, CaseRow } from "@/lib/types";
import CaseDetailView, { type CommentItem } from "./CaseDetailView";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: caseData }, { data: comments }, { data: ownUpvotes }, { data: ownSolve }, { data: solvedCounts }] =
    await Promise.all([
      supabase.from("cases").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("case_comments")
        .select("*, case_comment_upvotes(count)")
        .eq("case_id", id)
        .order("created_at", { ascending: false }),
      user
        ? supabase.from("case_comment_upvotes").select("comment_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { comment_id: string }[] }),
      user
        ? supabase
            .from("case_solves")
            .select("id")
            .eq("case_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.rpc("case_solved_counts"),
    ]);

  if (!caseData) {
    notFound();
  }

  const ownUpvoteSet = new Set((ownUpvotes ?? []).map((row) => row.comment_id));
  const solvedCount =
    (solvedCounts ?? []).find((row: { case_id: string; solved_count: number }) => row.case_id === id)
      ?.solved_count ?? 0;

  const commentItems: CommentItem[] = (
    (comments ?? []) as Array<CaseCommentRow & { case_comment_upvotes: { count: number }[] }>
  ).map((c) => ({
    ...c,
    upvotes: c.case_comment_upvotes?.[0]?.count ?? 0,
    isUpvoted: ownUpvoteSet.has(c.id),
  }));

  return (
    <CaseDetailView
      caseData={caseData as CaseRow}
      comments={commentItems}
      isSolved={Boolean(ownSolve)}
      solvedCount={Number(solvedCount)}
    />
  );
}
