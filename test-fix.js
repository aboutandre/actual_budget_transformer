// Test the parseAmount fix
function parseAmount(amountStr) {
  if (!amountStr.trim()) return 0;

  const trimmed = amountStr.trim();
  let normalized;

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

// Test cases
const testCases = [
  ["1.000", 1000],
  ["1.234,56", 1234.56],
  ["1,5", 1.5],
  ["-1.000", -1000],
  ["100", 100],
  ["-300", -300],
  ["5.153,79", 5153.79],
  ["1.5", 1.5],
];

console.log("Testing parseAmount fixes:\n");
let passed = 0;
testCases.forEach(([input, expected]) => {
  const result = parseAmount(input);
  const pass = result === expected;
  passed += pass ? 1 : 0;
  console.log(`parseAmount("${input}") = ${result} (expected ${expected}) ${pass ? "✓" : "✗"}`);
});

console.log(`\n${passed}/${testCases.length} tests passed`);
