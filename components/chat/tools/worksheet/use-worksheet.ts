import { useCallback, useState } from "react";

export function useWorksheet() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const toggleTool = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const resetWorksheet = useCallback(() => {
    // nanti bisa ditambahkan logic reset (mis. createEmptyWorksheet dari @/lib/chat-store)
  }, []);

  return {
    isEnabled,
    isPanelOpen,
    toggleTool,
    openPanel,
    closePanel,
    resetWorksheet,
  };
}