import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '../../../../lib/gmail';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const oauth2Client = getOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      message: 'Gmail connected successfully.'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to exchange code' }, { status: 500 });
  }
}