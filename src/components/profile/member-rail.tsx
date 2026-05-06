"use client";

import Link from "next/link";

import { AvatarCircle } from "@/components/ui/avatar";
import type { MemberLite, UserId } from "@/lib/types/frontend";

export function MemberRail({
  members,
  activeUserId,
}: {
  members: MemberLite[];
  activeUserId: UserId;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <ul className="flex items-stretch gap-2 px-1">
        {members.map((m) => {
          const active = m.userId === activeUserId;
          return (
            <li key={m.userId} className="shrink-0">
              <Link
                href={
                  m.userId === activeUserId ? "/profile" : `/profile/${m.userId}`
                }
                className={`relative flex min-h-21 w-20 flex-col items-center gap-2 rounded-2xl border px-2 py-3 shadow-card-flat transition ${
                  active
                    ? "border-[#D860B5]/60 bg-[#241320]"
                    : "border-[#1F1F1F] bg-[#161616] hover:border-[#D860B5]/35 hover:bg-[#1F1F1F]"
                }`}
              >
                <AvatarCircle member={m} size="md" />
                <span className="line-clamp-1 text-xs font-medium text-[#FAFAFA]">
                  {m.displayName}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#D860B5]"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

