"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CaseCommentRow } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function toggleCaseSolved(caseId: string): Promise<{ isSolved: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("case_solves")
    .select("id")
    .eq("case_id", caseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("case_solves").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    revalidatePath("/dashboard");
    return { isSolved: false };
  }

  const { error } = await supabase
    .from("case_solves")
    .insert({ case_id: caseId, user_id: user.id });
  if (error) throw new Error(error.message);

  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/dashboard");
  return { isSolved: true };
}

export async function postApproach(
  caseId: string,
  approachTitle: string,
  content: string
): Promise<{ error: string } | { comment: CaseCommentRow }> {
  const { supabase, user } = await requireUser();

  if (!approachTitle.trim() || !content.trim()) {
    return { error: "Please fill in both fields." };
  }

  const { data, error } = await supabase
    .from("case_comments")
    .insert({
      case_id: caseId,
      author_id: user.id,
      approach_title: approachTitle.trim(),
      content: content.trim(),
      // author_name/author_year get overwritten by the
      // set_case_comment_author_snapshot trigger from the author's profile.
      author_name: "",
    })
    .select()
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to post approach." };

  revalidatePath(`/cases/${caseId}`);
  return { comment: data as CaseCommentRow };
}

export async function toggleUpvote(commentId: string, caseId: string): Promise<{ upvoted: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("case_comment_upvotes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("case_comment_upvotes")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/cases/${caseId}`);
    return { upvoted: false };
  }

  const { error } = await supabase
    .from("case_comment_upvotes")
    .insert({ comment_id: commentId, user_id: user.id });
  if (error) throw new Error(error.message);

  revalidatePath(`/cases/${caseId}`);
  return { upvoted: true };
}
