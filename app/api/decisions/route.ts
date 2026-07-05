/**
 * Decisions API Routes
 * 
 * Endpoints:
 * - GET /api/decisions - List decisions with filtering
 * - POST /api/decisions - Create new decision
 * - GET /api/decisions/:id - Get single decision
 * - PATCH /api/decisions/:id - Update decision
 * - POST /api/decisions/:id/approve - Record approval
 * - POST /api/decisions/:id/execute - Execute decision
 */

import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngineService } from '@/core/decision-engine/service';
import { InMemoryDecisionRepository } from '@/core/decision-engine/repository';
import { DecisionStatus } from '@/core/decision-engine/types';
import { AuditLog, AuditEventType } from '@/core/governance/audit';

// Initialize services (would use Supabase in production)
const repository = new InMemoryDecisionRepository();
const service = new DecisionEngineService(repository);
const auditLog = new AuditLog();

/**
 * GET /api/decisions
 * List decisions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const contextType = searchParams.get('contextType');
    const search = searchParams.get('search');

    const query = {
      status: status ? (status as DecisionStatus) : undefined,
      contextType: contextType || undefined,
      search: search || undefined,
      limit: 20,
      offset: 0,
    };

    const result = await service.queryDecisions(query);

    return NextResponse.json({
      success: true,
      data: result.decisions,
      total: result.total,
    });
  } catch (error) {
    console.error('Error fetching decisions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch decisions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decisions
 * Create new decision with AI analysis and action plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'system';

    const {
      title,
      description,
      contextType,
      contextData,
      priority,
      requiredApprovers,
      aiAnalysis,
      actionPlan,
    } = body;

    // Create decision
    const decision = await service.createDecision(
      {
        title,
        description,
        contextType,
        contextData,
        priority,
        requiredApprovers,
      },
      userId,
      aiAnalysis,
      actionPlan
    );

    // Log audit event
    auditLog.recordEvent(
      AuditEventType.DECISION_CREATED,
      decision.id,
      userId,
      `Created decision: ${title}`,
      {
        title,
        contextType,
        priority,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: decision,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create decision' },
      { status: 500 }
    );
  }
}
