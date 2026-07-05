/**
 * Decision Detail API Routes
 * 
 * - GET /api/decisions/:id
 * - PATCH /api/decisions/:id
 * - POST /api/decisions/:id/approve
 * - POST /api/decisions/:id/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngineService } from '@/core/decision-engine/service';
import { InMemoryDecisionRepository } from '@/core/decision-engine/repository';
import { DecisionId } from '@/core/decision-engine/types';
import { AuditLog, AuditEventType } from '@/core/governance/audit';

const repository = new InMemoryDecisionRepository();
const service = new DecisionEngineService(repository);
const auditLog = new AuditLog();

/**
 * GET /api/decisions/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decision = await service.getDecision(params.id as DecisionId);

    if (!decision) {
      return NextResponse.json(
        { success: false, error: 'Decision not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    console.error('Error fetching decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch decision' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decisions/:id/approve
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'system';
    const action = request.nextUrl.searchParams.get('action');

    if (action === 'approve') {
      const { actorId, actorName, actorRole, approved, comment } = body;

      const decision = await service.recordApproval(
        params.id as DecisionId,
        actorId,
        actorName,
        actorRole,
        approved,
        comment
      );

      // Log audit event
      auditLog.recordEvent(
        approved ? AuditEventType.APPROVAL_RECORDED : AuditEventType.DECISION_REJECTED,
        decision.id,
        userId,
        `${approved ? 'Approved' : 'Rejected'} by ${actorName}`,
        {
          actorName,
          actorRole,
          approved,
          comment,
        }
      );

      return NextResponse.json({
        success: true,
        data: decision,
      });
    }

    if (action === 'execute') {
      const decision = await service.markForExecution(params.id as DecisionId);

      auditLog.recordEvent(
        AuditEventType.EXECUTION_STARTED,
        decision.id,
        userId,
        'Execution started',
        {}
      );

      return NextResponse.json({
        success: true,
        data: decision,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating decision:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update decision' },
      { status: 500 }
    );
  }
}
