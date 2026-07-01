import type { Locale } from "@/lib/config";
import type { WorksheetDocument } from "@/lib/worksheet";
import type { WorkflowWorkspace } from "@/lib/workflow";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { MapViewState } from "@/lib/map-types";
import type { ResearchSession } from "@/lib/research-types";
import type { IdaMessage } from "@/lib/types";

export interface UserChatSessionRow {
  user_id: string;
  chat_id: string;
  session_id: string;
  locale: Locale;
  title: string;
  messages: IdaMessage[];
  quick_replies: string[];
  pinned: boolean;
  worksheet: WorksheetDocument | null;
  workflow: WorkflowWorkspace | null;
  active_right_panel: RightSidebarPanel | null;
  worksheet_tool_enabled: boolean;
  workflow_tool_enabled: boolean;
  web_search_enabled: boolean;
  research_enabled: boolean;
  map_enabled: boolean;
  research_sessions: ResearchSession[];
  map_view_state: MapViewState;
  chat_created_at: string;
  chat_updated_at: string;
  updated_at: string;
}

export interface UserChatStateRow {
  user_id: string;
  current_chat_id: string;
  chat_order: string[];
  updated_at: string;
}