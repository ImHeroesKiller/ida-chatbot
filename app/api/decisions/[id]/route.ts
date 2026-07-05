'use client';

/**
 * Updated Decision Detail API Routes with Supabase Persistence
 * 
 * - GET /api/decisions/:id
 * - POST /api/decisions/:id/approve
 * - POST /api/decisions/:id/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngineService } from '@/core/decision-engine/service';
import { SupabaseDecisionRepository } from '@/core/decision-engine/repository';
import { DecisionId, DecisionStatus } from '@/core/decision-engine/types';
import { AuditEventType } from '@/core/governance/audit';
import { getSupabaseServerClient } from '@/lib/supabase/client';

/**
 * Initialize services
 */
function initializeServices() {
  const supabase = getSupabaseServerClient();
  const repository = new SupabaseDecisionRepository(supabase);
  const service = new DecisionEngineService(repository);
  return { service, repository };
}

/**
 * GET /api/decisions/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { service } = initializeServices();
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
    const message = error instanceof Error ? error.message : 'Failed to fetch decision';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decisions/:id
 * Handle approve and execute actions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { service, repository } = initializeServices();
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'system';
    const action = request.nextUrl.searchParams.get('action');
    const userAgent = request.headers.get('user-agent') || undefined;

    if (action === 'approve') {
      const { actorId, actorName, actorRole, approved, comment } = body;

      if (!actorId || !actorName || !actorRole) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: actorId, actorName, actorRole',
          },
          { status: 400 }
        );
      }

      const decision = await service.recordApproval(
        params.id as DecisionId,
        actorId,
        actorName,
        actorRole,
        approved,
        comment
      );

      // Log audit event
      if (repository instanceof SupabaseDecisionRepository) {
        const eventType = approved
          ? AuditEventType.APPROVAL_RECORDED
          : AuditEventType.DECISION_REJECTED;
        await repository.addAuditLog(
          decision.id,
          eventType,
          userId,
          `${approved ? 'Approved' : 'Rejected'} by ${actorName}`,
          {
            actorId,
            actorName,
            actorRole,
            approved,
            comment,
          },
          { userAgent }
        );
      }

      return NextResponse.json({
        success: true,
        data: decision,
      });
    }

    if (action === 'execute') {
      const decision = await service.markForExecution(params.id as DecisionId);

      if (repository instanceof SupabaseDecisionRepository) {
        await repository.addAuditLog(
          decision.id,
          AuditEventType.EXECUTION_STARTED,
          userId,
          'Execution started',
          {},
          { userAgent }
        );
      }

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
    const message = error instanceof Error ? error.message : 'Failed to update decision';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
