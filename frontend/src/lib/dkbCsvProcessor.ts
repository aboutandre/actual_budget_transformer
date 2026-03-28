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
  // Try dd.MM.yyyy or dd.MM.yy (DKB format)
  let match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
  if (match) {
    const [, day, month, yearRaw] = match;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${year}-${month}-${day}`;
  }
  
  // Try M/D/YYYY or MM/DD/YYYY (Deutsche Bank format)
  match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  
  return dateStr;
}

function parseAmount(amountStr: string): number {
  if (!amountStr.trim()) return 0;
  
  const trimmed = amountStr.trim();
  let normalized: string;
  
  const hasPeriod = trimmed.includes(".");
  const hasComma = trimmed.includes(",");
  
  if (hasComma && hasPeriod) {
    // German format with both: 1.234,56 → remove dots, replace comma with dot
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // German format with only comma: 1,5 → replace comma with dot
    normalized = trimmed.replace(",", ".");
  } else if (hasPeriod) {
    // Could be either format - check position of last period
    const lastPeriodIndex = trimmed.lastIndexOf(".");
    const digitsAfterPeriod = trimmed.length - lastPeriodIndex - 1;
    
    if (digitsAfterPeriod === 3) {
      // Likely German thousands separator: 1.000 → remove period
      normalized = trimmed.replace(/\./g, "");
    } else if (digitsAfterPeriod <= 2) {
      // Likely standard decimal separator: 1.5 or 1.50
      normalized = trimmed;
    } else {
      // More than 3 decimals - treat as standard decimal
      normalized = trimmed;
    }
  } else {
    // No separators
    normalized = trimmed;
  }
  
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
  let isDeutscheBankFormat = false;

  for (const line of lines) {
    const fields = line.split(";").map((f) => f.replace(/^"|"$/g, "").trim());
    const lower = line.toLowerCase();

    if (state === ParserState.SearchingForHeader) {
      // Check for Deutsche Bank credit card format
      if (
        lower.includes("voucher date") &&
        lower.includes("reason for payment") &&
        lower.includes("amount")
      ) {
        columnMap = mapColumns(fields);
        isDeutscheBankFormat = true;
        state = ParserState.ProcessingTransactions;
        continue;
      }

      // Check for DKB format
      if (
        lower.includes("betrag") &&
        (lower.includes("buchungsdatum") ||
          lower.includes("buchungstag") ||
          lower.includes("belegdatum") ||
          lower.includes("wertstellung"))
      ) {
        columnMap = mapColumns(fields);
        isDeutscheBankFormat = false;
        state = ParserState.ProcessingTransactions;
      }
      continue;
    }

    // ProcessingTransactions
    let date: string;
    let payee: string;
    let notes: string;
    let amountStr: string;

    if (isDeutscheBankFormat) {
      // Deutsche Bank credit card format
      date = getField(fields, columnMap!, ["voucher date", "belegdatum"]);
      payee = getField(fields, columnMap!, ["reason for payment", "beschreibung"]);
      notes = "";
      
      // Amount is the 5th column (index 4) in Deutsche Bank format, but we want the 7th (index 6) for the actual billing amount
      // Fields: Voucher date, Date of receipt, Reason for payment, Foreign currency, Amount, Exchange rate, Amount, Currency
      // We want index 6 (the second Amount column) if available
      if (fields.length > 6) {
        amountStr = fields[6].trim();
      } else {
        amountStr = getField(fields, columnMap!, ["amount"]);
      }
    } else {
      // DKB format
      date = getField(fields, columnMap!, [
        "buchungsdatum",
        "buchungstag",
        "wertstellung",
        "belegdatum",
      ]);
      const type = getField(fields, columnMap!, ["umsatztyp", "status"]);

      payee = "";
      if (type.toLowerCase().includes("eingang")) {
        payee = getField(fields, columnMap!, ["zahlungspflichtige*r"]);
      } else if (type.toLowerCase().includes("ausgang")) {
        payee = getField(fields, columnMap!, ["zahlungsempfänger*in"]);
      }
      if (!payee) {
        payee = getField(fields, columnMap!, [
          "zahlungsempfänger*in",
          "zahlungspflichtige*r",
          "auftraggeber / begünstigter",
          "beschreibung",
          "empfänger",
        ]);
      }

      notes = getField(fields, columnMap!, [
        "verwendungszweck",
        "umsatztyp",
        "buchungstext",
      ]);
      amountStr = getField(fields, columnMap!, [
        "betrag (€)",
        "betrag (eur)",
        "betrag",
      ]);
    }

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
