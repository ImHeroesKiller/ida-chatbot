import { NextResponse } from 'next/server';
import { getOAuth2Client } from '../../../../lib/gmail';

export async function GET() {
  const oauth2Client = getOAuth2Client();
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  });

  return NextResponse.redirect(authUrl);
}