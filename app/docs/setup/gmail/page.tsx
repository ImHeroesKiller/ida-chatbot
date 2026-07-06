import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Gmail OAuth Setup",
  description: "Configure Gmail OAuth for IDA Reality import.",
};

const STEPS = [
  {
    title: "Create a Google Cloud project",
    body: "Open Google Cloud Console and create or select a project for IDA.",
    link: "https://console.cloud.google.com/projectcreate",
  },
  {
    title: "Enable Gmail API",
    body: "In APIs & Services → Library, search Gmail API and enable it.",
    link: "https://console.cloud.google.com/apis/library/gmail.googleapis.com",
  },
  {
    title: "Configure OAuth consent screen",
    body: "Set app name, support email, and add scope: https://www.googleapis.com/auth/gmail.readonly",
    link: "https://console.cloud.google.com/apis/credentials/consent",
  },
  {
    title: "Create OAuth 2.0 Client ID",
    body: "Application type: Web application. Add authorized redirect URI for your deployment.",
    link: "https://console.cloud.google.com/apis/credentials",
  },
  {
    title: "Set environment variables",
    body: "Add the client credentials to .env.local (local) or Vercel project settings (production).",
  },
  {
    title: "Test the connection",
    body: "Open /demo → Import Data → Connect Gmail. Or use Load demo emails without OAuth.",
  },
] as const;

export default function GmailSetupPage() {
  const redirectLocal = "http://localhost:3000/api/gmail/callback";
  const redirectProd = "https://ida-chatbot.vercel.app/api/gmail/callback";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/demo"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to IDA Demo
        </Link>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Developer Setup
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Gmail OAuth Wizard</h1>
        <p className="mt-3 text-muted-foreground">
          Connect Gmail so IDA can import recent emails into organizational memory. Read-only
          access — no sending or deleting mail.
        </p>

        <div className="mt-8 space-y-4">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border border-border/50 bg-card/50 p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{step.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  {"link" in step && step.link ? (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Open in Google Cloud
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 p-5">
          <h2 className="font-semibold">Environment variables</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-4 text-xs leading-relaxed">
{`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=${redirectLocal}`}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Production redirect URI:
          </p>
          <code className="mt-1 block rounded bg-background px-3 py-2 text-xs">
            {redirectProd}
          </code>
        </div>

        <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-emerald-800">Investor demo without OAuth</h2>
              <p className="mt-1 text-sm text-emerald-900/80">
                If Gmail is not configured, use <strong>Load demo emails</strong> on the Import
                Data screen. The dashboard still updates with realistic PLN organizational data
                in under 2 minutes.
              </p>
              <Link
                href="/demo"
                className="mt-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
              >
                Open Import Data →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Need diagnostics? Open <Link href="/demo" className="text-primary hover:underline">/demo</Link> →
          Developer → Debug Dashboard
        </p>
      </div>
    </div>
  );
}