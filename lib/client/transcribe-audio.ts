import type { Locale } from "@/lib/config";

export async function transcribeAudioBlob(options: {
  blob: Blob;
  locale: Locale;
  sessionId?: string;
}): Promise<string> {
  const base64 = await blobToBase64(options.blob);

  const response = await fetch("/api/transcribe-groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: base64,
      mimeType: options.blob.type || "audio/webm",
      locale: options.locale,
      sessionId: options.sessionId,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    transcript?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to transcribe audio.");
  }

  return data.transcript?.trim() ?? "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read audio."));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Invalid audio data."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read audio."));
    reader.readAsDataURL(blob);
  });
}