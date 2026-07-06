// Smart Extractor v2 - Sprint 2
import { Representation } from './representation';

export interface BusinessExtraction {
  company: string | null;
  type: 'Invoice' | 'Meeting' | 'Proposal' | 'Complaint' | 'Purchase Order' | 'Contract' | 'Payment' | 'Reminder' | 'Information' | 'Other';
  summary: string;
  amount?: number;
  date?: string;
  priority?: 'high' | 'medium' | 'low';
}

export function extractBusinessInfo(rep: Representation): BusinessExtraction {
  const text = `${rep.title} ${rep.content}`.toLowerCase();
  const originalTitle = rep.title;

  let company: string | null = null;
  const companies = ['pln', 'mayora', 'telkom', 'bca', 'mandiri', 'bri', 'bni', 'gojek', 'grab', 'tokopedia', 'shopee'];
  for (const c of companies) {
    if (text.includes(c)) {
      company = c.toUpperCase();
      break;
    }
  }

  let type: BusinessExtraction['type'] = 'Other';
  
  if (text.includes('tagihan') || text.includes('invoice') || text.includes('rp ')) {
    type = 'Invoice';
  } else if (text.includes('meeting') || text.includes('q3') || text.includes('planning')) {
    type = 'Meeting';
  } else if (text.includes('proposal')) {
    type = 'Proposal';
  } else if (text.includes('keluhan') || text.includes('complaint')) {
    type = 'Complaint';
  } else if (text.includes('purchase order') || text.includes('po ')) {
    type = 'Purchase Order';
  } else if (text.includes('kontrak') || text.includes('contract')) {
    type = 'Contract';
  } else if (text.includes('pembayaran') || text.includes('payment')) {
    type = 'Payment';
  } else if (text.includes('reminder') || text.includes('jatuh tempo')) {
    type = 'Reminder';
  } else {
    type = 'Information';
  }

  let summary = originalTitle.length > 60 ? originalTitle.substring(0, 57) + '...' : originalTitle;

  let amount: number | undefined;
  const amountMatch = text.match(/rp\s*([\d.]+)/i);
  if (amountMatch) amount = parseInt(amountMatch[1].replace(/\./g, ''));

  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (text.includes('urgent') || text.includes('segera') || text.includes('jatuh tempo')) priority = 'high';

  return {
    company,
    type,
    summary,
    amount,
    date: rep.timestamp.toISOString().split('T')[0],
    priority,
  };
}