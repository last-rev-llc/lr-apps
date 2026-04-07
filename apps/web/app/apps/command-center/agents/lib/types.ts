export type AgentStatus = "active" | "inactive" | "error" | "running";

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  description?: string | null;
  last_run?: string | null;
  next_run?: string | null;
  run_count?: number | null;
  error_message?: string | null;
  config?: Record<string, unknown> | null;
  created_at?: string | null;
}
