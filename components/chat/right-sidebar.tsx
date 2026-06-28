"use client";

import {
  ToolPanelHost,
  type ToolPanelHostProps,
} from "@/components/chat/tools/tool-panel-host";

export type RightSidebarProps = ToolPanelHostProps;

export function RightSidebar(props: RightSidebarProps) {
  return <ToolPanelHost {...props} />;
}