import { generateId } from "@/core/shared/id";
import type { Representation } from "@ida/representation";

import { extractBusinessInfo } from "./extractors/email-rules";
import type { Observation } from "./types";

const EXTRACTOR_VERSION = "email-rules-v2";

export class ObservationEngine {
  observe(representation: Representation): Observation {
    return {
      id: generateId("obs"),
      representationId: representation.id,
      representation,
      observedAt: new Date().toISOString(),
      extractorVersion: EXTRACTOR_VERSION,
      extraction: extractBusinessInfo(representation),
    };
  }

  observeBatch(representations: Representation[]): Observation[] {
    return representations.map((representation) => this.observe(representation));
  }
}

export const observationEngine = new ObservationEngine();