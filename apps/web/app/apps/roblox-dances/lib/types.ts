export interface Dance {
  id: string;
  name: string;
  emoji: string;
  description: string;
  code: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  tags: string[];
  rating: number;
  ratingCount: number;
  createdAt: string;
}

export interface DanceSubmission {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  tags: string[];
  submittedBy: string;
  createdAt: string;
  status: "pending" | "approved";
}

export type Difficulty = "all" | "beginner" | "intermediate" | "advanced" | "expert";
export type SortKey = "rating" | "name" | "date" | "difficulty";
