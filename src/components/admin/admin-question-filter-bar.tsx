"use client";

import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type {
  AdminQuestionFilter,
  Category,
  QuestionType,
} from "@/lib/types/frontend";

const TYPE_OPTIONS: Array<{ value: QuestionType | "all"; label: string }> = [
  { value: "all", label: "Alle Typen" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multi_choice", label: "Multi Choice" },
  { value: "open_text", label: "Freitext" },
  { value: "duel_1v1", label: "1v1" },
  { value: "duel_2v2", label: "2v2" },
  { value: "either_or", label: "Entweder / Oder" },
  { value: "meme_caption", label: "Meme" },
];

const ACTIVE_OPTIONS: Array<{
  value: AdminQuestionFilter["active"];
  label: string;
}> = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiviert" },
];

export function AdminQuestionFilterBar({
  filter,
  onChange,
}: {
  filter: AdminQuestionFilter;
  onChange: (next: AdminQuestionFilter) => void;
}) {
  const categoryOptions = Object.entries(CATEGORY_LABELS) as Array<[Category, string]>;

  return (
    <div className="space-y-2.5 rounded-2xl bg-[#1A1A1A] p-3 ring-1 ring-[#1F1F1F]">
      <SearchInput
        value={filter.search}
        onChange={(search) => onChange({ ...filter, search })}
      />
      <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-3">
        <SelectField
          label="Kategorie"
          value={filter.category}
          options={[
            { value: "all", label: "Alle Kategorien" },
            ...categoryOptions.map(([value, label]) => ({ value, label })),
          ]}
          onChange={(category) => onChange({ ...filter, category })}
        />
        <SelectField
          label="Typ"
          value={filter.type}
          options={TYPE_OPTIONS}
          onChange={(type) => onChange({ ...filter, type })}
        />
        <SelectField
          label="Status"
          value={filter.active}
          options={ACTIVE_OPTIONS}
          onChange={(active) => onChange({ ...filter, active })}
        />
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73]"
      >
        ⌕
      </span>
      <input
        type="search"
        placeholder="Frage suchen..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 w-full rounded-xl bg-[#0E0E0E] pl-9 pr-3 text-sm text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition placeholder:text-[#6E6E73] focus:ring-[#4A5699]"
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <label className="block space-y-1">
      <span
        className="block text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-10 w-full appearance-none rounded-xl bg-[#0E0E0E] px-3 text-sm font-semibold text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition focus:ring-[#4A5699]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236E6E73' d='M5 6 0 0h10z'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.875rem center",
          paddingRight: "2rem",
        }}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ backgroundColor: "#1A1A1A", color: "#FAFAFA" }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
