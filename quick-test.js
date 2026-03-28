// Quick test for the specific issue
function parseAmount(amountStr) {
  if (!amountStr.trim()) return 0;
  const trimmed = amountStr.trim();
  let normalized;
  const hasPeriod = trimmed.includes(".");
  const hasComma = trimmed.includes(",");
  
  if (hasComma && hasPeriod) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = trimmed.replace(",", ".");
  } else if (hasPeriod) {
    const lastPeriodIndex = trimmed.lastIndexOf(".");
    const digitsAfterPeriod = trimmed.length - lastPeriodIndex - 1;
    if (digitsAfterPeriod === 3) {
      normalized = trimmed.replace(/\./g, "");
    } else if (digitsAfterPeriod <= 2) {
      normalized = trimmed;
    } else {
      normalized = trimmed;
    }
  } else {
    normalized = trimmed;
  }
  const val = parseFloat(normalized);
  return isNaN(val) ? 0 : val;
}

// Test the specific values from the DKB_CASH_PROBLEM file
const testValues = ["-1.000", "1.000", "-1.362", "-518", "-794,61", "-317,84", "-40", "-280", "-300", "-150"];
console.log("Testing values from DKB_CASH_PROBLEM.csv:");
testValues.forEach(val => {
  console.log(`parseAmount('${val}') = ${parseAmount(val)}`);
});
