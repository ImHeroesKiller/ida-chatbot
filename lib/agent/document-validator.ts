import type {
  AgentDocumentCategory,
  AgentFileType,
  AgentUploadedDocument,
} from "./types";

const MANDATORY_BY_CATEGORY: Record<AgentDocumentCategory, string[]> = {
  financial_report: ["period", "total", "revenue"],
  contract: ["parties", "effective_date", "terms"],
  spreadsheet_data: ["headers", "rows"],
  general_document: ["content"],
  unknown: [],
};

const CATEGORY_KEYWORDS: Record<AgentDocumentCategory, string[]> = {
  financial_report: [
    "revenue",
    "profit",
    "loss",
    "quarter",
    "financial",
    "laporan",
    "keuangan",
    "pendapatan",
  ],
  contract: [
    "agreement",
    "contract",
    "parties",
    "kontrak",
    "perjanjian",
    "terms",
  ],
  spreadsheet_data: ["sheet", "column", "row", "table", "data", "total"],
  general_document: [],
  unknown: [],
};

export function classifyDocument(
  fileName: string,
  fileType: AgentFileType,
  text: string,
): AgentDocumentCategory {
  const lower = `${fileName} ${text}`.toLowerCase();

  if (fileType === "xlsx") return "spreadsheet_data";

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "general_document" || category === "unknown") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as AgentDocumentCategory;
    }
  }

  if (fileType === "pdf" && /report|laporan/i.test(fileName)) {
    return "financial_report";
  }

  return "general_document";
}

export function validateDocumentRules(options: {
  fileName: string;
  fileType: AgentFileType;
  text: string;
}): {
  status: "valid" | "warning" | "invalid";
  notes: string[];
  category: AgentDocumentCategory;
  mandatoryFieldsFound: string[];
  mandatoryFieldsMissing: string[];
} {
  const { fileName, fileType, text } = options;
  const notes: string[] = [];
  const category = classifyDocument(fileName, fileType, text);
  const mandatory = MANDATORY_BY_CATEGORY[category];
  const lower = text.toLowerCase();

  const mandatoryFieldsFound = mandatory.filter((field) => {
    const patterns: Record<string, RegExp> = {
      period: /period|quarter|q[1-4]|periode|triwulan/i,
      total: /total|jumlah|sum/i,
      revenue: /revenue|pendapatan|income/i,
      parties: /party|parties|pihak|between/i,
      effective_date: /effective|berlaku|date|tanggal/i,
      terms: /terms|syarat|conditions/i,
      headers: /[,|\t]|header|kolom/i,
      rows: /\n/,
      content: /.{20,}/,
    };
    return patterns[field]?.test(lower) ?? lower.includes(field);
  });

  const mandatoryFieldsMissing = mandatory.filter(
    (field) => !mandatoryFieldsFound.includes(field),
  );

  if (!text.trim()) {
    return {
      status: "invalid",
      notes: [`${fileName}: tidak ada teks yang dapat diekstrak.`],
      category,
      mandatoryFieldsFound: [],
      mandatoryFieldsMissing: mandatory,
    };
  }

  if (mandatoryFieldsMissing.length > 0 && category !== "general_document") {
    notes.push(
      `${fileName}: field wajib belum terdeteksi — ${mandatoryFieldsMissing.join(", ")}.`,
    );
  }

  if (text.length < 80) {
    notes.push(`${fileName}: konten sangat pendek — verifikasi manual disarankan.`);
  }

  return {
    status:
      mandatoryFieldsMissing.length > 0 && category !== "general_document"
        ? "warning"
        : notes.length > 0
          ? "warning"
          : "valid",
    notes,
    category,
    mandatoryFieldsFound,
    mandatoryFieldsMissing,
  };
}

export function summarizeDocumentTypes(
  documents: AgentUploadedDocument[],
): AgentDocumentCategory[] {
  return [...new Set(documents.map((doc) => doc.documentCategory))];
}