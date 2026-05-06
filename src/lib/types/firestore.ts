import type { Category, QuestionType, RevealPolicy, TargetMode, UserRole } from "@/lib/types/frontend";

export interface UserDoc {
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
  isActive: boolean;
  bonusTrophyCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSeenAt?: unknown;
}

export interface QuestionDoc {
  text: string;
  category: Category;
  type: QuestionType;
  targetMode: TargetMode;
  active: boolean;
  dailyLocked?: boolean;
  dailyLockedDateKey?: string | null;
  options?: string[];
  imagePath?: string;
  source?: "admin_pool" | "user_trophy";
  ownerUserId?: string | null;
  targetDateKey?: string | null;
  consumedInDailyDateKey?: string | null;
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
}

export interface DailyRunItemDoc {
  questionId: string;
  type: QuestionType;
  questionSnapshot?: {
    text: string;
    category: Category;
    options?: string[];
    imagePath?: string;
  };
  pairing?: {
    memberIds?: [string, string];
    teamA?: [string, string];
    teamB?: [string, string];
  };
}

export interface DailyRunDoc {
  runId?: string;
  dateKey: string;
  runNumber?: number;
  timezone: "Europe/Berlin";
  status: "scheduled" | "active" | "closed";
  questionCount: number;
  revealPolicy: RevealPolicy;
  questionIds: string[];
  items?: DailyRunItemDoc[];
  createdAt?: unknown;
  createdBy?: string;
  updatedAt?: unknown;
}

export interface DailyAnswerDoc {
  runId?: string;
  dateKey: string;
  questionId: string;
  userId: string;
  questionType: QuestionType;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedOptionIndex?: number;
  selectedSide?: "left" | "right";
  selectedTeam?: "teamA" | "teamB";
  textAnswer?: string;
  duelContext?: {
    memberIds?: string[];
    teamA?: string[];
    teamB?: string[];
  };
  createdAt?: unknown;
}

export interface DailyPrivateAnswerDoc {
  runId?: string;
  dateKey: string;
  questionId: string;
  userId: string;
  questionType: QuestionType;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedOptionIndex?: number;
  selectedSide?: "left" | "right";
  selectedTeam?: "teamA" | "teamB";
  textAnswer?: string;
  duelContext?: {
    memberIds?: string[];
    teamA?: string[];
    teamB?: string[];
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DailyFirstAnswerDoc {
  runId?: string;
  dateKey: string;
  questionId: string;
  userId: string;
  createdAt?: unknown;
}

export interface DailyMemeVoteDoc {
  runId?: string;
  dateKey: string;
  questionId: string;
  authorUserId: string;
  voterUserId: string;
  createdAt?: unknown;
}

export interface ActivityEventDoc {
  dateKey: string;
  type: "answer_submitted" | "comment_created" | "meme_winner";
  userId: string;
  questionId?: string;
  runId?: string;
  payload?: {
    commentPreview?: string;
    memeWinnerUserId?: string;
  };
  createdAt?: unknown;
}

export interface DailyCommentDoc {
  dateKey: string;
  runId: string;
  questionId: string;
  userId: string;
  text: string;
  createdAt?: unknown;
  editedAt?: unknown;
}

export interface UserStatsDoc {
  userId: string;
  daily?: {
    answeredCount: number;
    streakCurrent: number;
    streakBest: number;
    firstAnswerCount: number;
  };
  live?: {
    roundsPlayed: number;
    roundsHosted: number;
    answersSubmitted: number;
  };
  duels?: {
    wins: number;
    losses: number;
  };
  publicVotesReceived?: {
    total: number;
    byCategory: Partial<Record<Category, number>>;
  };
  categoryActivity?: Partial<Record<Category, number>>;
  updatedAt?: unknown;
}

export interface LiveSessionDoc {
  hostUserId: string;
  code: string;
  status: "lobby" | "question" | "reveal" | "finished";
  categories: Category[];
  questionIds: string[];
  currentQuestionIndex: number;
  questionDurationSec: number;
  revealDurationSec: number;
  createdAt?: unknown;
  startedAt?: unknown;
  phaseStartedAt?: unknown;
  finishedAt?: unknown;
  items?: DailyRunItemDoc[];
}

export interface LiveParticipantDoc {
  userId: string;
  displayName: string;
  photoURL: string | null;
  joinedAt?: unknown;
  isHost: boolean;
  connected: boolean;
}

export interface LiveAnswerDoc {
  sessionId: string;
  questionId: string;
  questionIndex: number;
  userId: string;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedOptionIndex?: number;
  selectedSide?: "left" | "right";
  selectedTeam?: "teamA" | "teamB";
  textAnswer?: string;
  duelContext?: {
    memberIds?: string[];
    teamA?: string[];
    teamB?: string[];
  };
  submittedAt?: unknown;
}

export interface LivePrivateAnswerDoc {
  sessionId: string;
  questionId: string;
  questionIndex: number;
  userId: string;
  questionType: QuestionType;
  selectedUserId?: string;
  selectedUserIds?: string[];
  selectedOptionIndex?: number;
  selectedSide?: "left" | "right";
  selectedTeam?: "teamA" | "teamB";
  textAnswer?: string;
  duelContext?: {
    memberIds?: string[];
    teamA?: string[];
    teamB?: string[];
  };
  submittedAt?: unknown;
  updatedAt?: unknown;
}

export interface LiveLobbyCodeDoc {
  code: string;
  sessionId: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppConfigDoc {
  timezone: "Europe/Berlin";
  dailyQuestionCount: number;
  dailyRevealPolicy: RevealPolicy;
  onboardingEnabled: boolean;
  dailyAutoCreateEnabled?: boolean;
  dailyIncludedCategories?: Category[];
  dailyForcedCategories?: Category[];
  lastAutoCreatedDateKey?: string;
  liveDefaultQuestionDurationSec: number;
  liveDefaultRevealDurationSec: number;
  updatedAt?: unknown;
}
