interface EvalVerificationResult {
  success: boolean;
  reason?: string;
}


// Probs just want to do an LLM call here to verify the response - Had this previously in Verve
export function verifyEvalResponse({
  outputQuery,
  targetQuery,
}: {
  outputQuery: string;
  targetQuery: string;
}): EvalVerificationResult {
  // Normalize queries by removing extra whitespace and making case consistent
  const normalizedOutput = outputQuery
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const normalizedTarget = targetQuery
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const isMatch = normalizedOutput === normalizedTarget;

  return {
    success: isMatch,
    reason: isMatch 
      ? "SQL queries match exactly"
      : "SQL queries do not match",
  };
}
