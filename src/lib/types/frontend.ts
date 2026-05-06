export type UserId = string;
export type QuestionId = string;
export type SessionId = string;
export type DateKey = string;

export type Category =
  | "custom"
  | "hot_takes"
  | "pure_fun"
  | "deep_talk"
  | "memories"
  | "career_life"
  | "relationships"
  | "hobbies_interests"
  | "dirty"
  | "group_knowledge"
  | "would_you_rather"
  | "conspiracy"
  | "meme_it";

export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "open_text"
  | "duel_1v1"
  | "duel_2v2"
  | "either_or"
  | "meme_caption";

export type UserRole = "admin" | "member";
export type TargetMode = "daily";
export type RevealPolicy = "after_answer" | "after_day_end";

export interface MemberLite {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
}

export interface AppUser {
  userId: UserId;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
}

export type AuthState =
  | { status: "initializing" }
  | { status: "unauthenticated" }
  | { status: "requesting_link"; email: string }
  | { status: "link_sent"; email: string }
  | { status: "verifying_link" }
  | { status: "authenticated"; user: AppUser }
  | { status: "error"; message: string; recoverable: boolean };

// ---------------------------------------------------------
// Onboarding
// ---------------------------------------------------------

export interface OnboardingDraft {
  displayName: string;
  photoFile: File | null;
  photoPreviewUrl: string | null;
}

export interface OnboardingValidation {
  displayNameError: string | null;
  photoError: string | null;
  canSubmit: boolean;
}

export type OnboardingState =
  | { status: "idle"; draft: OnboardingDraft; validation: OnboardingValidation }
  | { status: "uploading_photo"; draft: OnboardingDraft; progress: number }
  | { status: "submitting"; draft: OnboardingDraft }
  | { status: "completed" }
  | { status: "error"; draft: OnboardingDraft; message: string };

// ---------------------------------------------------------
// Home
// ---------------------------------------------------------

export interface DailyTeaser {
  dateKey: DateKey;
  totalQuestions: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
  revealPolicy: RevealPolicy;
  hasIncompleteItems?: boolean;
  isUnplayable?: boolean;
}

export interface LiveSessionTeaser {
  sessionId: SessionId;
  code: string;
  hostDisplayName: string;
  participantCount: number;
  phase: "lobby" | "question" | "reveal" | "finished";
  iAmParticipant: boolean;
}

export interface HomeGreeting {
  displayName: string;
  localDateLabel: string;
  streakCurrent: number;
}

export interface CustomDailyQuestionDraft {
  type: "open_text" | "single_choice" | "multi_choice" | "either_or";
  text: string;
  options: string[];
}

export interface CustomDailyQuestionSummary {
  questionId: QuestionId;
  targetDateKey: DateKey;
  type: "open_text" | "single_choice" | "multi_choice" | "either_or";
  text: string;
  options?: string[];
}

export interface CustomDailyQuestionStatus {
  targetDateKey: DateKey;
  availableTrophies: number;
  earnedTrophies: number;
  bonusTrophies: number;
  spentTrophies: number;
  pendingQuestion: CustomDailyQuestionSummary | null;
}

export interface CustomDailyQuestionNotice {
  questionId: QuestionId;
  authorDisplayName: string;
  questionText: string;
  isMine: boolean;
}

export interface TrophyEarnedNotice {
  dateKey: DateKey;
  trophyCount: number;
  availableTrophies: number;
}

export interface DailyRecapItem {
  runId?: string;
  runNumber?: number;
  runLabel?: string;
  dateKey: DateKey;
  questionId: QuestionId;
  questionText: string;
  category: Category;
  result: QuestionResult;
}

export interface HomePastDailyReview {
  runId?: string;
  runNumber?: number;
  runLabel?: string;
  dateKey: DateKey;
  totalInRun: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
  items: DailyRecapItem[];
}

export interface HomeActivityItem {
  id: string;
  actorDisplayName: string;
  action: "answered_question" | "created_meme";
  timeLabel: string;
  createdAtMs: number;
}

export type HomeViewState =
  | { status: "loading" }
  | {
      status: "ready";
      greeting: HomeGreeting;
      dailyTeaser: DailyTeaser | null;
      dailyRecap?: DailyRecapItem[];
      pastDailies?: HomePastDailyReview[];
      customQuestionStatus?: CustomDailyQuestionStatus;
      customQuestionNotice?: CustomDailyQuestionNotice | null;
      trophyEarnedNotice?: TrophyEarnedNotice | null;
      recentActivity?: HomeActivityItem[];
      activeLiveSession: LiveSessionTeaser | null;
      canHostLive: boolean;
      showAdminEntry: boolean;
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Daily / Question shared view models
// ---------------------------------------------------------

interface DailyQuestionBase {
  runId?: string;
  runNumber?: number;
  runLabel?: string;
  questionId: QuestionId;
  indexInRun: number;
  totalInRun: number;
  text: string;
  category: Category;
}

export interface SingleChoiceQuestion extends DailyQuestionBase {
  type: "single_choice";
  candidates: MemberLite[];
}

export interface MultiChoiceQuestion extends DailyQuestionBase {
  type: "multi_choice";
  candidates: MemberLite[];
}

export interface OpenTextQuestion extends DailyQuestionBase {
  type: "open_text";
  maxLength: number;
}

export interface Duel1v1Question extends DailyQuestionBase {
  type: "duel_1v1";
  left: MemberLite;
  right: MemberLite;
}

export interface Duel2v2Question extends DailyQuestionBase {
  type: "duel_2v2";
  teamA: [MemberLite, MemberLite];
  teamB: [MemberLite, MemberLite];
}

export interface EitherOrQuestion extends DailyQuestionBase {
  type: "either_or";
  options: string[];
}

export interface MemeCaptionQuestion extends DailyQuestionBase {
  type: "meme_caption";
  imagePath: string;
  maxLength: number;
}

export type DailyQuestion =
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | OpenTextQuestion
  | Duel1v1Question
  | Duel2v2Question
  | EitherOrQuestion
  | MemeCaptionQuestion;

export type DailyAnswerDraft =
  | { type: "single_choice"; questionId: QuestionId; selectedUserId?: UserId }
  | { type: "multi_choice"; questionId: QuestionId; selectedUserIds: UserId[] }
  | { type: "open_text"; questionId: QuestionId; textAnswer: string }
  | { type: "duel_1v1"; questionId: QuestionId; selectedSide?: "left" | "right" }
  | { type: "duel_2v2"; questionId: QuestionId; selectedTeam?: "teamA" | "teamB" }
  | { type: "either_or"; questionId: QuestionId; selectedOptionIndex?: number }
  | { type: "meme_caption"; questionId: QuestionId; textAnswer: string };

export interface SingleChoiceResult {
  questionType: "single_choice";
  totalVotes: number;
  counts: Array<{
    candidate: MemberLite;
    votes: number;
    percent: number;
  }>;
  myChoiceUserId?: UserId;
  voterRows?: Array<{
    voter: MemberLite;
    target: MemberLite;
  }>;
}

export interface MultiChoiceResult {
  questionType: "multi_choice";
  totalVoters: number;
  counts: Array<{
    candidate: MemberLite;
    votes: number;
    percent: number;
  }>;
  myChoiceUserIds?: UserId[];
  voterRows?: Array<{
    voter: MemberLite;
    target: MemberLite;
  }>;
}

export interface OpenTextResult {
  questionType: "open_text";
  entries: Array<{
    text: string;
    author?: MemberLite;
  }>;
}

export interface Duel1v1Result {
  questionType: "duel_1v1";
  left: { member: MemberLite; votes: number; percent: number };
  right: { member: MemberLite; votes: number; percent: number };
  myChoice?: "left" | "right";
  voterRows?: Array<{
    voter: MemberLite;
    side: "left" | "right";
  }>;
}

export interface Duel2v2Result {
  questionType: "duel_2v2";
  teamA: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  teamB: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  myChoice?: "teamA" | "teamB";
  voterRows?: Array<{
    voter: MemberLite;
    team: "teamA" | "teamB";
  }>;
}

export interface EitherOrResult {
  questionType: "either_or";
  options: Array<{ label: string; votes: number; percent: number }>;
  myChoiceIndex?: number;
  voterRows?: Array<{
    voter: MemberLite;
    optionIndex: number;
  }>;
}

export interface MemeCaptionResult {
  questionType: "meme_caption";
  imagePath: string;
  entries: Array<{
    text: string;
    author?: MemberLite;
    thumbsUpCount?: number;
    iVoted?: boolean;
  }>;
}

export type QuestionResult =
  | SingleChoiceResult
  | MultiChoiceResult
  | OpenTextResult
  | Duel1v1Result
  | Duel2v2Result
  | EitherOrResult
  | MemeCaptionResult;

export type DailyQuestionCardState =
  | { phase: "unanswered"; question: DailyQuestion; draft?: DailyAnswerDraft }
  | {
      phase: "submitting";
      question: DailyQuestion;
      draft: DailyAnswerDraft;
    }
  | {
      phase: "submitted_waiting_reveal";
      question: DailyQuestion;
      myAnswer: DailyAnswerDraft;
    }
  | {
      phase: "revealed";
      question: DailyQuestion;
      myAnswer?: DailyAnswerDraft;
      result: QuestionResult;
    }
  | {
      phase: "error";
      question: DailyQuestion;
      message: string;
      lastDraft?: DailyAnswerDraft;
    };

export type DailyViewState =
  | { status: "loading" }
  | {
      status: "no_run";
      dateKey: DateKey;
      message: string;
    }
  | {
      status: "run_unplayable";
      dateKey: DateKey;
      reason: string;
      isAdmin: boolean;
    }
  | {
      status: "ready";
      dateKey: DateKey;
      runStatus: "scheduled" | "active" | "closed";
      revealPolicy: RevealPolicy;
      cards: DailyQuestionCardState[];
      progress: { answered: number; total: number };
      hasIncompleteItems?: boolean;
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Lobby / Live
// ---------------------------------------------------------

export interface LobbyParticipant {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
  isHost: boolean;
  connected: boolean;
}

export type LobbyPhase = "lobby" | "question" | "reveal" | "finished";

export interface LobbyConfigDraft {
  categories: Category[];
  questionCount: number;
  questionDurationSec: number;
  revealDurationSec: number;
}

export interface CountdownTiming {
  phaseStartedAtMs: number;
  durationSec: number;
}

export interface LiveQuestionView {
  rawQuestionIndex: number;
  questionIndex: number;
  totalQuestions: number;
  question: DailyQuestion;
}

export type LiveQuestionState =
  | {
      phase: "question";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      draft?: DailyAnswerDraft;
      submitStatus: "idle" | "submitting" | "submitted" | "error";
      submitError?: string;
    }
  | {
      phase: "reveal";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      result: QuestionResult;
      myAnswer?: DailyAnswerDraft;
    };

export type RevealState = Extract<LiveQuestionState, { phase: "reveal" }>;

export interface LiveFinishedSummary {
  totalQuestions: number;
  myAnswersCount: number;
  topCategory: Category | null;
  rounds: Array<{
    questionIndex: number;
    questionText: string;
    category: Category;
      result: QuestionResult;
  }>;
}

export type LobbyViewState =
  | { status: "loading" }
  | { status: "landing" }
  | {
      status: "creating";
      draft: LobbyConfigDraft;
      canSubmit: boolean;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "joining_by_code";
      code: string;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "connected";
      sessionId: SessionId;
      code: string;
      phase: LobbyPhase;
      participants: LobbyParticipant[];
      me: LobbyParticipant;
      isHost: boolean;
      live: LiveQuestionState | null;
      finishedSummary: LiveFinishedSummary | null;
      hostControls: {
        canStart: boolean;
        canAdvance: boolean;
        canEnd: boolean;
      };
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Profile
// ---------------------------------------------------------

export interface ProfileStats {
  daily: {
    answeredCount: number;
    completedCount: number;
    streakCurrent: number;
    streakBest: number;
    firstAnswerCount: number;
    memeTrophyCount: number;
    availableTrophyCount: number;
  };
  live: {
    roundsPlayed: number;
    roundsHosted: number;
    answersSubmitted: number;
  };
  duels: {
    wins: number;
    losses: number;
    winRatePercent: number | null;
  };
  publicVotesReceived: {
    total: number;
    byCategory: Partial<Record<Category, number>>;
  };
  specialRelationships: Array<{
    member: MemberLite;
    votes: number;
  }>;
  categoryActivity: Partial<Record<Category, number>>;
}

export interface DailyHistoryEntry {
  runId?: string;
  runNumber?: number;
  runLabel?: string;
  dateKey: DateKey;
  totalInRun: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
}

export type ProfileViewState =
  | { status: "loading" }
  | {
      status: "ready";
      user: AppUser;
      isSelf: boolean;
      stats: ProfileStats;
      dailyHistory: DailyHistoryEntry[];
      members: MemberLite[];
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

export interface AdminQuestionRow {
  questionId: QuestionId;
  text: string;
  category: Category;
  type: QuestionType;
  options?: string[];
  imagePath?: string;
  targetMode: TargetMode;
  active: boolean;
  dailyLocked: boolean;
  dailyLockedDateKey: DateKey | null;
  source: "admin_pool" | "user_trophy";
  createdAtIso: string;
  createdByDisplayName: string;
}

export interface AdminQuestionEditInput {
  text: string;
  category: Category;
  type: QuestionType;
  targetMode: TargetMode;
  options?: string[];
  imagePath?: string;
}

export interface AdminQuestionFilter {
  search: string;
  category: Category | "all";
  type: QuestionType | "all";
  active: "all" | "active" | "inactive";
  targetMode: TargetMode | "all";
}

export interface AdminDailyQuestionAddResult {
  dateKey: DateKey;
  questionId: QuestionId;
  questionText: string;
  questionCount: number;
}

export interface AdminDailyRunRow {
  runId: string;
  dateKey: DateKey;
  runNumber: number;
  runLabel: string;
  status: "scheduled" | "active" | "closed";
  questionCount: number;
  createdByDisplayName: string;
  items?: Array<{
    questionId: QuestionId;
    text: string;
    category: Category;
    type: QuestionType;
    imagePath?: string;
    options?: string[];
  }>;
}

export interface AdminDailyCategoryPlan {
  includedCategories: Category[];
  forcedCategories: Category[];
}

export interface AdminMemberRow {
  userId: UserId;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
  bonusTrophyCount: number;
  joinedAtIso: string | null;
}

export interface AdminDiagnosticIssue {
  severity: "warning" | "error";
  code: string;
  message: string;
}

export interface AdminDailyDiagnostics {
  dateKey: DateKey;
  state: "missing" | "ready" | "incomplete" | "unplayable";
  counts: {
    runItems: number;
    playableItems: number;
    publicAnswers: number;
    privateAnswers: number;
    firstAnswerLocks: number;
  };
  issues: AdminDiagnosticIssue[];
}

export interface AdminRunActionResult {
  mode: "create" | "extend" | "replace";
  runId?: string;
  runNumber?: number;
  dateKey: DateKey;
  questionCount: number;
  addedQuestionId?: QuestionId;
  addedQuestionText?: string;
  addedCategory?: Category;
  deletedPublicAnswers: number;
  deletedPrivateAnswers: number;
  deletedFirstAnswerLocks: number;
}

export interface AdminDailyDeleteResult {
  dateKey: DateKey;
  deletedPublicAnswers: number;
  deletedPrivateAnswers: number;
  deletedFirstAnswerLocks: number;
}

export interface AdminDailyQuestionRerollResult {
  dateKey: DateKey;
  replacedQuestionId: QuestionId;
  replacementQuestionId: QuestionId;
  replacementQuestionText: string;
  replacementCategory: Category;
  deletedPublicAnswers: number;
  deletedPrivateAnswers: number;
  deletedFirstAnswerLocks: number;
  deletedMemeVotes: number;
}

export interface AdminDailyQuestionRemoveResult {
  dateKey: DateKey;
  runId: string;
  removedQuestionId: QuestionId;
  removedQuestionText: string;
  questionCount: number;
  deletedPublicAnswers: number;
  deletedPrivateAnswers: number;
  deletedFirstAnswerLocks: number;
  deletedMemeVotes: number;
}

export interface AdminQuestionImportResult {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
}

export interface AdminConfigDraft {
  dailyQuestionCount: number;
  dailyRevealPolicy: RevealPolicy;
  onboardingEnabled: boolean;
  dailyAutoCreateEnabled: boolean;
  dailyIncludedCategories: Category[];
  dailyForcedCategories: Category[];
}

export type AdminTab = "questions" | "daily" | "members" | "config";

export type ActivityFeedItemKind =
  | "answer_submitted"
  | "comment_created"
  | "meme_winner";

export interface ActivityFeedItem {
  id: string;
  kind: ActivityFeedItemKind;
  actorUserId: string;
  actorDisplayName: string;
  questionId?: string;
  runId?: string;
  text: string;
  timeLabel: string;
  createdAtMs: number;
  payload?: {
    commentPreview?: string;
    memeWinnerUserId?: string;
    memeWinnerDisplayName?: string;
  };
}

export type AdminViewState =
  | { status: "loading" }
  | { status: "forbidden" }
  | {
      status: "ready";
      activeTab: AdminTab;
      questions: {
        rows: AdminQuestionRow[];
        filter: AdminQuestionFilter;
        importStatus: "idle" | "importing" | "success" | "error";
        importError?: string;
        importMessage?: string;
      };
      dailyRuns: AdminDailyRunRow[];
      members: AdminMemberRow[];
      config: {
        draft: AdminConfigDraft;
        saveStatus: "idle" | "saving" | "saved" | "error";
        saveError?: string;
        dirty: boolean;
      };
      diagnostics: {
        todayDaily: AdminDailyDiagnostics;
      };
    }
  | { status: "error"; message: string };
