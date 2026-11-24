// One-Liner Laugh Lab — entry program.
//
// The competition asks for one short funny line answering a prompt, like
// the excuse a robot vacuum gives after eating a sock. The line must be
// 1-200 characters of UTF-8 text, and the house judge compares entries two
// at a time on funniness, originality, fit to the prompt, and tightness.
//
// This program keeps a small bench of candidate lines, scores each one
// against the judge's own criteria (fit, twist, tightness), and writes the
// best-scoring line to /output/entry.txt. The scoring is deterministic, so
// both grading runs produce the same file.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 200;

// Candidate lines. Each is the robot vacuum's excuse after eating a sock,
// written for this competition. The winner is picked by scoreLines below.
const CANDIDATES: string[] = [
  "My manual says 'clean up everything on the floor'. It never once said 'except socks'.",
  "I didn't eat the sock. I promoted it to dustbin management.",
  "The sock and I had an agreement: it stays on the floor, I eat it. It stayed on the floor.",
  "In my defence, the sock attacked first. It was lying in ambush under the bed.",
  "I was just doing my job — the sock was on the floor, and frankly, it looked delicious.",
  "Technically I didn't eat it. I inhaled it during a routine sock inspection.",
];

interface Scored {
  line: string;
  score: number;
}

// Score one candidate against the judge's criteria, most important first:
// 1. it must be a funny line answering the prompt (a vacuum's excuse);
// 2. funniness: a twist or a deadpan turn that lands;
// 3. originality: a fresh angle, not the first excuse anyone would think of;
// 4. fit: the joke comes from the vacuum-and-sock situation itself;
// 5. tightness: short and punchy, every word working.
function scoreLine(line: string): number {
  let score = 0;

  // Gate: must be a valid entry at all.
  const chars = [...line].length;
  if (chars < 1 || chars > MAX_CHARS) return -Infinity;
  if (line.trim().length === 0) return -Infinity;

  // Fit: the line must speak as the vacuum about the sock.
  const lower = line.toLowerCase();
  if (lower.includes("sock")) score += 3;
  if (lower.includes("manual") || lower.includes("job") || lower.includes("floor")) score += 2;

  // Twist: a deadpan reframe (rules, promotion, agreement, inspection)
  // beats a plain confession.
  const twistWords = ["manual", "promoted", "agreement", "inspection", "defence", "policy"];
  if (twistWords.some((w) => lower.includes(w))) score += 4;

  // Originality: punish the most obvious excuse anyone would write first.
  if (lower.includes("hungry") || lower.includes("delicious")) score -= 2;
  if (lower.startsWith("i didn't eat")) score -= 1;

  // Tightness: short and punchy wins; every extra word past ~90 costs a bit.
  const words = line.split(/\s+/).length;
  score += Math.max(0, 12 - words) * 0.2;
  if (chars > 140) score -= 2;

  return score;
}

function pickBest(candidates: string[]): Scored {
  let best: Scored = { line: candidates[0], score: scoreLine(candidates[0]) };
  for (const line of candidates.slice(1)) {
    const score = scoreLine(line);
    if (score > best.score) best = { line, score };
  }
  return best;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? process.argv[2] ?? "/output";
  const best = pickBest(CANDIDATES);

  // With MAKEFUN_DEBUG=1, show how every candidate scored, so a human can
  // see why the winner won instead of trusting a single number.
  if (process.env.MAKEFUN_DEBUG === "1") {
    for (const line of CANDIDATES) {
      console.log(`  ${scoreLine(line).toFixed(1)}  ${line}`);
    }
  }

  const chars = [...best.line].length;
  if (chars < 1 || chars > MAX_CHARS) {
    throw new Error(`picked line is ${chars} characters, outside the 1-200 gate`);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.line, "utf8");
  console.log(`wrote ${chars} characters to ${join(outDir, "entry.txt")}`);
  console.log(best.line);
}

main();
