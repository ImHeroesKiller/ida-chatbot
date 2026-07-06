import { NextResponse } from "next/server";

export type ApiErrorBody = {
  success: false;
  code: string;
  message: string;
  suggestion: string;
  requestId: string;
};

export type ApiSuccessBody<T extends Record<string, unknown> = Record<string, unknown>> = {
  success: true;
  requestId: string;
} & T;

export function jsonWithRequestId<T extends Record<string, unknown>>(
  body: T,
  requestId: string,
  init?: ResponseInit,
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("x-request-id", requestId);
  return NextResponse.json({ ...body, requestId }, { ...init, headers });
}

export function apiError(
  requestId: string,
  code: string,
  message: string,
  suggestion: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return jsonWithRequestId(
    { success: false, code, message, suggestion },
    requestId,
    { status },
  ) as NextResponse<ApiErrorBody>;
}