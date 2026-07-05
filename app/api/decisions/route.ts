/**
 * Updated Decisions API Routes with Supabase Persistence
 * 
 * Endpoints:
 * - GET /api/decisions - List decisions with filtering
 * - POST /api/decisions - Create new decision
 */

import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngineService } from '@/core/decision-engine/service';
import { SupabaseDecisionRepository } from '@/core/decision-engine/repository';
import { DecisionStatus, DecisionContextType } from '@/core/decision-engine/types';
import { AuditLog, AuditEventType } from '@/core/governance/audit';
import { getSupabaseServerClient } from '@/lib/supabase/client';

/**
 * Initialize Supabase repository and service
 */
function initializeServices() {
  const supabase = getSupabaseServerClient();
  const repository = new SupabaseDecisionRepository(supabase);
  const service = new DecisionEngineService(repository);
  const auditLog = new AuditLog();

  return { service, repository, auditLog, supabase };
}

/**
 * GET /api/decisions
 * List decisions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { service } = initializeServices();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const contextType = searchParams.get('contextType');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const query = {
      status: status ? (status as DecisionStatus) : undefined,
      contextType: contextType ? (contextType as DecisionContextType) : undefined,
      search: search || undefined,
      limit,
      offset,
    };

    const result = await service.queryDecisions(query);

    return NextResponse.json({
      success: true,
      data: result.decisions,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching decisions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch decisions';
    return NextResponse.json(
      { success: false, error: message },
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
    const { service, repository, auditLog } = initializeServices();
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'system';
    const userAgent = request.headers.get('user-agent') || undefined;

    const {
      title,
      description,
      contextType,
      contextData,
      priority,
      requiredApprovers,
      aiAnalysis,
      actionPlan,
      tags,
      externalId,
    } = body;

    // Validate required fields
    if (!title || !description || !contextType || !aiAnalysis || !actionPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, description, contextType, aiAnalysis, actionPlan',
        },
        { status: 400 }
      );
    }

    // Create decision
    const decision = await service.createDecision(
      {
        title,
        description,
        contextType,
        contextData,
        priority,
        requiredApprovers,
        tags,
        externalId,
      },
      userId,
      aiAnalysis,
      actionPlan
    );

    // Log audit event
    if (repository instanceof SupabaseDecisionRepository) {
      await repository.addAuditLog(
        decision.id,
        AuditEventType.DECISION_CREATED,
        userId,
        `Created decision: ${title}`,
        {
          title,
          contextType,
          priority,
        },
        { userAgent }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: decision,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating decision:', error);
    const message = error instanceof Error ? error.message : 'Failed to create decision';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
