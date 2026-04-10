export type ExperimentStatus = "exploring" | "active" | "shelved" | "shipped";
export type ExperimentCategory = "ai" | "infra" | "ux" | "data" | "other";

export interface ExperimentLink {
  label: string;
  url: string;
}

export interface Experiment {
  id: string;
  title: string;
  description?: string | null;
  status: ExperimentStatus;
  category?: ExperimentCategory | null;
  owner?: string | null;
  outcome?: string | null;
  links?: ExperimentLink[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
