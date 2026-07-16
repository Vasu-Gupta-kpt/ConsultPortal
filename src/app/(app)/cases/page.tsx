import { createClient } from "@/lib/supabase/server";
import type { CaseRow } from "@/lib/types";
import CasesBrowser, { type CaseListItem } from "./CasesBrowser";

export default async function CasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cases, error: casesError }, { data: solvedCounts }, { data: ownSolves }] =
    await Promise.all([
      supabase.from("cases").select("*").order("created_at", { ascending: false }),
      supabase.rpc("case_solved_counts"),
      user
        ? supabase.from("case_solves").select("case_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { case_id: string }[] }),
    ]);

  if (casesError) {
    throw new Error(casesError.message);
  }

  const solvedCountByCase = new Map<string, number>(
    (solvedCounts ?? []).map(
      (row: { case_id: string; solved_count: number }): [string, number] => [
        row.case_id,
        Number(row.solved_count),
      ]
    )
  );
  const ownSolvedCaseIds = new Set((ownSolves ?? []).map((row) => row.case_id));

  const items: CaseListItem[] = ((cases ?? []) as CaseRow[]).map((c) => ({
    ...c,
    solvedCount: solvedCountByCase.get(c.id) ?? 0,
    isSolved: ownSolvedCaseIds.has(c.id),
  }));

  return <CasesBrowser cases={items} />;
}
