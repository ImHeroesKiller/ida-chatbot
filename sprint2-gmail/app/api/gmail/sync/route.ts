import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentEmails } from '../../../../lib/gmail';
import { createEmailRepresentation } from '../../../../lib/representation';
import { extractBusinessInfo } from '../../../../lib/extractor';

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'No access token' }, { status: 400 });
    }

    const emails = await fetchRecentEmails(access_token, 30);
    
    const representations = emails.map(email => {
      const rep = createEmailRepresentation({
        subject: email.subject,
        snippet: email.snippet,
        from: email.from,
        date: email.date,
      });
      
      const business = extractBusinessInfo(rep);
      (rep as any).business = business;
      
      return rep;
    });

    return NextResponse.json({
      success: true,
      count: representations.length,
      lastSync: new Date().toISOString(),
      representations,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error.message 
    }, { status: 500 });
  }
}