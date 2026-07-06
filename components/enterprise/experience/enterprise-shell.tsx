"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useEnterprise } from "./enterprise-context";
import { useViewLoading } from "./use-view-loading";
import { ViewSkeleton } from "./view-skeleton";
import { EnterpriseSidebar } from "./enterprise-sidebar";
import { EnterpriseTopbar } from "./enterprise-topbar";
import { GlobalSearch } from "./global-search";
import { WhyIdaView } from "./views/why-ida-view";
import { ExecutiveBriefView } from "./views/executive-brief-view";
import { OrganizationView } from "./views/organization-view";
import { CompaniesView } from "./views/companies-view";
import { PeopleView } from "./views/people-view";
import { ProjectsView } from "./views/projects-view";
import { TimelineView } from "./views/timeline-view";
import { MemoryView } from "./views/memory-view";
import { RoadmapView } from "./views/roadmap-view";
import { CoreMessageBanner } from "./core-message-banner";
import { InvestorFaqModal } from "./investor-faq-modal";
import { TrustSignals } from "./trust-signals";

function ActiveView() {
  const { view } = useEnterprise();
  const loading = useViewLoading();

  const content = (() => {
    switch (view) {
      case "why-ida":
        return <WhyIdaView />;
      case "executive-brief":
        return <ExecutiveBriefView />;
      case "organization":
        return <OrganizationView />;
      case "companies":
        return <CompaniesView />;
      case "people":
        return <PeopleView />;
      case "projects":
        return <ProjectsView />;
      case "timeline":
        return <TimelineView />;
      case "memory":
        return <MemoryView />;
      case "roadmap":
        return <RoadmapView />;
      case "search":
        return <ExecutiveBriefView />;
      default:
        return <ExecutiveBriefView />;
    }
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${view}-${loading ? "loading" : "ready"}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        {loading ? <ViewSkeleton view={view} /> : content}
      </motion.div>
    </AnimatePresence>
  );
}

export function EnterpriseShell() {
  return (
    <div className="enterprise-demo enterprise-demo-bg flex h-dvh max-h-dvh flex-col overflow-hidden font-sans text-foreground">
      <EnterpriseTopbar />
      <div className="flex min-h-0 flex-1">
        <EnterpriseSidebar />
        <main className="enterprise-demo-scroll flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <CoreMessageBanner />
            <ActiveView />
            <div className="mt-10">
              <TrustSignals compact />
            </div>
          </div>
        </main>
      </div>
      <GlobalSearch />
      <InvestorFaqModal />
    </div>
  );
}