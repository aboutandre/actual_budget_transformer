enum ParserState {
  SearchingForHeader,
  ProcessingTransactions,
}

type ColumnMap = Map<string, number>;

function normalizeHeader(h: string): string {
  return h.trim().replace(/^"|"$/g, "").replace("(€)", "(EUR)").toLowerCase();
}

function mapColumns(fields: string[]): ColumnMap {
  const map: ColumnMap = new Map();
  for (let i = 0; i < fields.length; i++) {
    const key = normalizeHeader(fields[i]);
    if (!map.has(key)) map.set(key, i);
  }
  return map;
}

function getField(fields: string[], map: ColumnMap, keys: string[]): string {
  for (const key of keys) {
    const norm = normalizeHeader(key);
    const idx = map.get(norm);
    if (idx !== undefined && idx < fields.length) return fields[idx];
  }
  return "";
}

function transformDate(dateStr: string): string {
  // dd.MM.yyyy or dd.MM.yy
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
  if (!match) return dateStr;
  const [, day, month, yearRaw] = match;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month}-${day}`;
}

function parseAmount(amountStr: string): number {
  if (!amountStr.trim()) return 0;
  // German format: "1.234,56" → remove dots, replace comma with dot
  const normalized = amountStr.replace(/\./g, "").replace(",", ".");
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

function escapeCsvField(field: string): string {
  if (field.includes(",")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function processDkbCsv(csvContent: string): string {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const transactions: string[] = ["Date,Payee,Notes,Outflow,Inflow"];

  let state = ParserState.SearchingForHeader;
  let columnMap: ColumnMap | null = null;

  for (const line of lines) {
    const fields = line.split(";").map((f) => f.replace(/^"|"$/g, "").trim());
    const lower = line.toLowerCase();

    if (state === ParserState.SearchingForHeader) {
      if (
        lower.includes("betrag") &&
        (lower.includes("buchungsdatum") ||
          lower.includes("buchungstag") ||
          lower.includes("belegdatum") ||
          lower.includes("wertstellung"))
      ) {
        columnMap = mapColumns(fields);
        state = ParserState.ProcessingTransactions;
      }
      continue;
    }

    // ProcessingTransactions
    const date = getField(fields, columnMap!, [
      "Buchungsdatum",
      "Buchungstag",
      "Wertstellung",
      "Belegdatum",
    ]);
    const type = getField(fields, columnMap!, ["Umsatztyp", "Status"]);

    let payee = "";
    if (type.toLowerCase().includes("eingang")) {
      payee = getField(fields, columnMap!, ["Zahlungspflichtige*r"]);
    } else if (type.toLowerCase().includes("ausgang")) {
      payee = getField(fields, columnMap!, ["Zahlungsempfänger*in"]);
    }
    if (!payee) {
      payee = getField(fields, columnMap!, [
        "Zahlungsempfänger*in",
        "Zahlungspflichtige*r",
        "Auftraggeber / Begünstigter",
        "Beschreibung",
        "Empfänger",
      ]);
    }

    const notes = getField(fields, columnMap!, [
      "Verwendungszweck",
      "Umsatztyp",
      "Buchungstext",
    ]);
    const amountStr = getField(fields, columnMap!, [
      "Betrag (€)",
      "Betrag (EUR)",
      "Betrag",
    ]);

    if (!date || !payee || !amountStr) continue;

    const transformedDate = transformDate(date);
    const amount = parseAmount(amountStr);
    if (amount === 0) continue;

    const outflow = amount < 0 ? Math.abs(amount).toFixed(2) : "";
    const inflow = amount > 0 ? amount.toFixed(2) : "";
    transactions.push(
      `${transformedDate},${escapeCsvField(payee)},${escapeCsvField(notes)},${outflow},${inflow}`
    );
  }

  return transactions.join("\n");
}
