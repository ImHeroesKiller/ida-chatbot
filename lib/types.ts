export interface IdaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
}

export interface IdaChatErrorResponse {
  error: string;
}

export interface IdaHandoffPrefill {
  topic: string;
  description: string;
}