// Real Gmail Integration - Sprint 2
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback'
  );
}

export async function getGmailClient(accessToken: string) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

export async function fetchRecentEmails(accessToken: string, maxResults = 50) {
  const gmail = await getGmailClient(accessToken);
  
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'newer_than:7d',
  });

  const messages = res.data.messages || [];
  const emails = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

    emails.push({
      id: msg.id,
      subject,
      from,
      date,
      snippet: detail.data.snippet || '',
    });
  }

  return emails;
}