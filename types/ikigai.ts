export type IkigaiDimension = "love" | "good" | "world" | "paid";

export interface DimensionData {
  key: IkigaiDimension;
  label: string;
  description: string;
  color: string;
  glowColor: string;
  progress: number; // 0-100
  insights: string[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface IkigaiState {
  dimensions: Record<IkigaiDimension, DimensionData>;
  messages: ConversationMessage[];
  currentFocus: IkigaiDimension | null;
  isComplete: boolean;
  ikigaiTitle: string | null;
  ikigaiExplanation: string | null;
  phase: "idle" | "conversation" | "synthesizing" | "revealed" | "careers";
}

export interface IkigaiSynthesis {
  title: string;
  subtitle: string;
  highlights: string[];            // 3-4 ultra-short punchy phrases (3-5 words each)
  explanation: string;
  patterns: string[];
  strengths: string[];
  idealEnvironments: string[];
  motivations: string[];
  deepDive: { heading: string; detail: string }[];  // expandable sections
  careerKeywords?: string[];
  jobSearchTerms?: string[];     // simple 1-3 word job titles for actual job board queries
  sideQuests?: string[];
  purposeAdvice?: string[];
  quadrantItems?: {
    love: string[];
    skill: string[];
    world: string[];
    paid: string[];
  };
  vennDetails?: {
    love: string[];
    skill: string[];
    world: string[];
    paid: string[];
    passion: string[];
    mission: string[];
    profession: string[];
    vocation: string[];
    ikigai: string[];
  };
  careerPaths?: Array<{
    title: string;
    tagline: string;
    timeline: string;
    milestones: Array<{ period: string; action: string }>;
    searchTerms?: string[];
  }>;
  kamiyaNeeds?: {
    met: string[];
    unmet: string[];
  };
  ikigaiScore?: {
    score: number;       // 0-100
    reasoning: string;   // 1 short sentence, shown inline
    detail?: string;     // 2-3 sentence deep dive, shown in popup
  };
  /** @deprecated use careerPaths */
  careerTransition?: { steps: string[]; timeline: string };
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  url: string;
  ikigaiAlignment: string;
  matchScore: number;
  skills: string[];
  fitReasons: string[];            // personalized "why you're a great fit" bullets
  source: string;
}

export const DIMENSIONS: DimensionData[] = [
  {
    key: "love",
    label: "What You Love",
    description: "Activities that make time disappear",
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.4)",
    progress: 0,
    insights: [],
  },
  {
    key: "good",
    label: "What You're Good At",
    description: "Your natural strengths",
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
    progress: 0,
    insights: [],
  },
  {
    key: "world",
    label: "What The World Needs",
    description: "Problems you want to solve",
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.4)",
    progress: 0,
    insights: [],
  },
  {
    key: "paid",
    label: "What You Can Be Paid For",
    description: "Value you can create",
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.4)",
    progress: 0,
    insights: [],
  },
];
