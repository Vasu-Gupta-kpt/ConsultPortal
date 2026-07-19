import type { FrameworkNode } from "./types";

// Parses admin-typed indented text into a FrameworkNode tree, e.g.:
//
//   *Market Entry
//     *Market Attractiveness
//       *Market Size
//         Demand
//         Supply
//       Growth and trends
//     Risk & Benefits
//
// Indentation depth determines nesting (stack-based: pop while the top of
// the stack is at >= the current line's indent, then attach as a child of
// whatever remains). A leading `*` marks a branch as "explored". A single
// least-indented line becomes the root; if the input has multiple, they're
// wrapped under a synthetic label-less root (FrameworkTreeView skips empty
// labels, so this renders as just their top-level siblings).
export function parseFrameworkTree(text: string): FrameworkNode | null {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;

  const roots: FrameworkNode[] = [];
  const stack: { node: FrameworkNode; indent: number }[] = [];

  for (const rawLine of lines) {
    const indent = rawLine.length - rawLine.trimStart().length;
    let content = rawLine.trim();
    const explored = content.startsWith("*");
    if (explored) content = content.slice(1).trim();

    const node: FrameworkNode = explored ? { label: content, explored: true } : { label: content };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      const parent = stack[stack.length - 1].node;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    }

    stack.push({ node, indent });
  }

  if (roots.length === 1) return roots[0];
  return { label: "", children: roots };
}
