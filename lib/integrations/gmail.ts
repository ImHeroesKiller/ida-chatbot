import "server-only";

const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export function isGmailConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export async function getOAuth2Client() {
  const { google } = await import("googleapis");

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3000/api/gmail/callback",
  );
}

export function getGmailAuthUrl(): string {
  if (!isGmailConfigured()) {
    throw new Error(
      "Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }

  // URL built synchronously for redirect route — client created in route handler.
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback";

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailCode(code: string) {
  const oauth2Client = await getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchRecentEmails(accessToken: string, maxResults = 50) {
  const { google } = await import("googleapis");
  const oauth2Client = await getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "newer_than:7d",
  });

  const messages = res.data.messages ?? [];
  const emails = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers ?? [];
    const subject =
      headers.find((h) => h.name === "Subject")?.value ?? "No Subject";
    const from =
      headers.find((h) => h.name === "From")?.value ?? "Unknown";
    const date =
      headers.find((h) => h.name === "Date")?.value ??
      new Date().toISOString();

    emails.push({
      id: msg.id!,
      subject,
      from,
      date,
      snippet: detail.data.snippet ?? "",
    });
  }

  return emails;
}