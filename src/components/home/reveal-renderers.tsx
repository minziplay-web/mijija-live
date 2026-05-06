"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import {
  MemeCaptionCarousel,
  RevealBarChart,
  STORY_COLORS,
  type RevealOption,
} from "@/components/story";
import type {
  Duel1v1Result,
  Duel2v2Result,
  EitherOrResult,
  MemberLite,
  MemeCaptionResult,
  MultiChoiceResult,
  OpenTextResult,
  QuestionResult,
  SingleChoiceResult,
} from "@/lib/types/frontend";

/**
 * RevealBody — Body-Slot für StoryShell auf der Home-Reveal-Page.
 *
 * Mappt QuestionResult → passendes Reveal-UI:
 *   - single/multi_choice / either_or / duel_1v1 / duel_2v2 → RevealBarChart
 *   - open_text → eigene Liste (Avatar + Name + Antwort)
 *   - meme_caption → Bild + Caption-Liste mit Vote-Counts
 *
 * Visual: Instagram-light, kein Italic, kein Card-in-Card. Geist Sans + Mono
 * für Numbers. Akzentfarbe wird vom Aufrufer (Slide) als `accentColor` gepicht
 * — entspricht der CategoryColor aus StoryShell.
 */
export function RevealBody({
  result,
  accentColor,
  runId,
  dateKey,
  questionId,
  currentUserId,
}: {
  result: QuestionResult;
  accentColor: string;
  runId?: string;
  dateKey?: string;
  questionId?: string;
  currentUserId?: string;
}) {
  switch (result.questionType) {
    case "single_choice":
      return <SingleChoiceBody result={result} accentColor={accentColor} />;
    case "multi_choice":
      return <MultiChoiceBody result={result} accentColor={accentColor} />;
    case "either_or":
      return <EitherOrBody result={result} accentColor={accentColor} />;
    case "duel_1v1":
      return <Duel1v1Body result={result} accentColor={accentColor} />;
    case "duel_2v2":
      return <Duel2v2Body result={result} accentColor={accentColor} />;
    case "open_text":
      return <OpenTextBody result={result} />;
    case "meme_caption":
      return (
        <MemeCaptionBody
          result={result}
          accentColor={accentColor}
          runId={runId}
          dateKey={dateKey}
          questionId={questionId}
          currentUserId={currentUserId}
        />
      );
  }
}

// ---------------------------------------------------------
// Helpers — convert QuestionResult voter rows → RevealOption[]
// ---------------------------------------------------------

function votersByTarget(
  rows: ReadonlyArray<{ voter: MemberLite; target: MemberLite }> | undefined,
): Map<string, MemberLite[]> {
  const grouped = new Map<string, MemberLite[]>();
  for (const row of rows ?? []) {
    const list = grouped.get(row.target.userId) ?? [];
    list.push(row.voter);
    grouped.set(row.target.userId, list);
  }
  return grouped;
}

// ---------------------------------------------------------
// Single-Choice → BarChart (members as options)
// ---------------------------------------------------------

function SingleChoiceBody({
  result,
  accentColor,
}: {
  result: SingleChoiceResult;
  accentColor: string;
}) {
  const grouped = votersByTarget(result.voterRows);
  const options: RevealOption[] = result.counts.map((row) => ({
    key: row.candidate.userId,
    label: row.candidate.displayName,
    votes: row.votes,
    member: row.candidate,
    voters: grouped.get(row.candidate.userId) ?? [],
  }));

  return (
    <RevealBarChart
      options={options}
      totalVoters={result.totalVotes}
      primaryColor={accentColor}
    />
  );
}

// ---------------------------------------------------------
// Multi-Choice → BarChart (members as options)
// ---------------------------------------------------------

function MultiChoiceBody({
  result,
  accentColor,
}: {
  result: MultiChoiceResult;
  accentColor: string;
}) {
  const grouped = votersByTarget(result.voterRows);
  const options: RevealOption[] = result.counts.map((row) => ({
    key: row.candidate.userId,
    label: row.candidate.displayName,
    votes: row.votes,
    member: row.candidate,
    voters: grouped.get(row.candidate.userId) ?? [],
  }));

  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-[11px] tabular-nums"
        style={{
          color: STORY_COLORS.ink50,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        {result.totalVoters}{" "}
        {result.totalVoters === 1 ? "Antwort" : "Antworten"} · Mehrfachauswahl
      </p>
      <RevealBarChart
        options={options}
        totalVoters={result.totalVoters}
        primaryColor={accentColor}
      />
    </div>
  );
}

// ---------------------------------------------------------
// Either-Or → BarChart (two text options)
// ---------------------------------------------------------

function EitherOrBody({
  result,
  accentColor,
}: {
  result: EitherOrResult;
  accentColor: string;
}) {
  const grouped = new Map<number, MemberLite[]>();
  for (const row of result.voterRows ?? []) {
    const list = grouped.get(row.optionIndex) ?? [];
    list.push(row.voter);
    grouped.set(row.optionIndex, list);
  }

  const totalVoters = result.options.reduce((sum, opt) => sum + opt.votes, 0);
  const options: RevealOption[] = result.options.map((opt, idx) => ({
    key: `opt-${idx}`,
    label: opt.label,
    votes: opt.votes,
    voters: grouped.get(idx) ?? [],
  }));

  return (
    <RevealBarChart
      options={options}
      totalVoters={totalVoters}
      primaryColor={accentColor}
    />
  );
}

// ---------------------------------------------------------
// Duel 1v1 → BarChart (two member sides)
// ---------------------------------------------------------

function Duel1v1Body({
  result,
  accentColor,
}: {
  result: Duel1v1Result;
  accentColor: string;
}) {
  const leftVoters = (result.voterRows ?? [])
    .filter((row) => row.side === "left")
    .map((row) => row.voter);
  const rightVoters = (result.voterRows ?? [])
    .filter((row) => row.side === "right")
    .map((row) => row.voter);

  const totalVoters = result.left.votes + result.right.votes;
  const options: RevealOption[] = [
    {
      key: "left",
      label: result.left.member.displayName,
      votes: result.left.votes,
      member: result.left.member,
      voters: leftVoters,
    },
    {
      key: "right",
      label: result.right.member.displayName,
      votes: result.right.votes,
      member: result.right.member,
      voters: rightVoters,
    },
  ];

  return (
    <RevealBarChart
      options={options}
      totalVoters={totalVoters}
      primaryColor={accentColor}
    />
  );
}

// ---------------------------------------------------------
// Duel 2v2 → BarChart (two team rows)
// ---------------------------------------------------------

function Duel2v2Body({
  result,
  accentColor,
}: {
  result: Duel2v2Result;
  accentColor: string;
}) {
  const teamAVoters = (result.voterRows ?? [])
    .filter((row) => row.team === "teamA")
    .map((row) => row.voter);
  const teamBVoters = (result.voterRows ?? [])
    .filter((row) => row.team === "teamB")
    .map((row) => row.voter);
  const totalVoters = result.teamA.votes + result.teamB.votes;

  const labelOf = (members: readonly MemberLite[]) =>
    members.map((m) => m.displayName).join(" & ");

  const options: RevealOption[] = [
    {
      key: "teamA",
      label: labelOf(result.teamA.members),
      votes: result.teamA.votes,
      voters: teamAVoters,
    },
    {
      key: "teamB",
      label: labelOf(result.teamB.members),
      votes: result.teamB.votes,
      voters: teamBVoters,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Pair-Avatar-Row über dem Chart, da BarChart pro Option nur ein Avatar
          unterstützt — bei 2v2 wollen wir aber beide Mitglieder sehen. */}
      <div className="flex items-center justify-between gap-3">
        <TeamAvatars members={result.teamA.members} />
        <span
          className="text-[11px] tabular-nums"
          style={{
            color: STORY_COLORS.ink50,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.06em",
          }}
        >
          VS
        </span>
        <TeamAvatars members={result.teamB.members} reverse />
      </div>
      <RevealBarChart
        options={options}
        totalVoters={totalVoters}
        primaryColor={accentColor}
      />
    </div>
  );
}

function TeamAvatars({
  members,
  reverse = false,
}: {
  members: readonly MemberLite[];
  reverse?: boolean;
}) {
  const ordered = reverse ? [...members].reverse() : members;
  return (
    <div className={`flex items-center ${reverse ? "flex-row-reverse" : ""}`}>
      {ordered.map((m, idx) => (
        <div
          key={m.userId}
          className={idx === 0 ? "" : reverse ? "-mr-2" : "-ml-2"}
        >
          <AvatarCircle member={m} size="sm" className="ring-2 ring-white" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------
// Open-Text → eigene Liste mit Avatar + Antwort
// ---------------------------------------------------------

function OpenTextBody({ result }: { result: OpenTextResult }) {
  if (result.entries.length === 0) {
    return (
      <p
        className="text-[13px]"
        style={{ color: STORY_COLORS.ink50 }}
      >
        Noch keine Antworten.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {result.entries.map((entry, idx) => (
        <li
          key={idx}
          className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0"
          style={{ borderColor: STORY_COLORS.hairSoft }}
        >
          {entry.author ? (
            <div className="flex items-center gap-2.5">
              <AvatarCircle member={entry.author} size="sm" />
              <span
                className="text-[13px]"
                style={{ color: STORY_COLORS.ink, fontWeight: 600 }}
              >
                {entry.author.displayName}
              </span>
            </div>
          ) : (
            <span
              className="text-[11px]"
              style={{ color: STORY_COLORS.ink50, fontFamily: "var(--font-mono)" }}
            >
              UNBEKANNT
            </span>
          )}
          <p
            className="text-[15px] leading-snug"
            style={{ color: STORY_COLORS.ink, fontWeight: 400 }}
          >
            {entry.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------
// Meme-Caption → Caption-Carousel (jeder Caption ein Insta-Post)
// ---------------------------------------------------------

function MemeCaptionBody({
  result,
  accentColor,
  runId,
  dateKey,
  questionId,
  currentUserId,
}: {
  result: MemeCaptionResult;
  accentColor: string;
  runId?: string;
  dateKey?: string;
  questionId?: string;
  currentUserId?: string;
}) {
  return (
    <MemeCaptionCarousel
      result={result}
      accentColor={accentColor}
      runId={runId}
      dateKey={dateKey}
      questionId={questionId}
      currentUserId={currentUserId}
    />
  );
}
