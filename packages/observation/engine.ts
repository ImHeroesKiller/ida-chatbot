import { generateId } from "@/core/shared/id";
import type { Representation } from "@ida/representation";

import { extractFromDocument } from "./extractors/document-rules";
import { extractBusinessInfo } from "./extractors/email-rules";
import type { Observation } from "./types";

const EXTRACTOR_VERSION = "reality-v1";

export class ObservationEngine {
  observe(representation: Representation): Observation {
    const extraction =
      representation.sourceType === "document"
        ? extractFromDocument(representation)
        : extractBusinessInfo(representation);

    return {
      id: generateId("obs"),
      representationId: representation.id,
      representation,
      observedAt: new Date().toISOString(),
      extractorVersion: EXTRACTOR_VERSION,
      extraction,
    };
  }

  observeBatch(representations: Representation[]): Observation[] {
    return representations.map((representation) => this.observe(representation));
  }
}

export const observationEngine = new ObservationEngine();