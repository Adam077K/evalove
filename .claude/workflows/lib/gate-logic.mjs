// Pure, testable logic for the {{PROJECT_NAME}} T5 QA gate.
//
// WHY THIS FILE EXISTS: the Workflow runtime runs each .claude/workflows/*.js script in a
// sandbox with NO module import. So qa.js cannot `import` from here at runtime — it MIRRORS
// these implementations inline. This module is the canonical, unit-tested spec; the inline
// copies in qa.js MUST stay in sync with it. (If the runtime ever gains relative-import support,
// switch qa.js to import these directly and delete the inline copies.)
//
// Run the tests:  node --test .claude/workflows/lib/

/** args may arrive as an object OR a JSON string — normalize to a plain object. */
export function normalizeArgs(args) {
  let a = args
  if (typeof a === 'string') {
    try { a = JSON.parse(a) } catch (e) { a = {} }
  }
  return a && typeof a === 'object' ? a : {}
}

/**
 * A finding is confirmed only with a quorum (>=2 votes cast) AND a strict majority real.
 * A lone 1-of-1 vote or a 1-of-2 tie must NOT confirm.
 */
export function isConfirmed(votes) {
  const valid = (votes || []).filter(Boolean)
  return valid.length >= 2 && valid.filter(v => v && v.is_real).length * 2 > valid.length
}

/**
 * A finding is block-eligible (worth spending 3 adversarial verifiers on) only if its severity
 * could actually BLOCK at this tier: P1 always; P2 only at irreversible. P3 (and P2 at full) are
 * non-blocking, so we report them advisory/unverified rather than paying to verify them.
 */
export function isBlockEligible(severity, tier) {
  return severity === 'P1' || (tier === 'irreversible' && severity === 'P2')
}

/**
 * Deterministic gate verdict — never trusts the judge LLM alone.
 * BLOCK if a critical dimension failed to review, OR a confirmed P1 exists,
 * OR (irreversible tier) a confirmed P1/P2 exists. Else defer to the judge verdict.
 */
export function decideVerdict({ confirmed = [], tier = 'full', failedDims = [], criticalDims = ['correctness', 'security'], judgeVerdict = 'PASS' }) {
  const criticalGap = failedDims.filter(d => criticalDims.includes(d))
  const mustBlock = confirmed.filter(f => f && (f.severity === 'P1' || (tier === 'irreversible' && f.severity === 'P2')))
  if (criticalGap.length > 0 || mustBlock.length > 0) return 'BLOCK'
  return judgeVerdict === 'BLOCK' ? 'BLOCK' : 'PASS'
}

/** Cap a finding list to the N highest-severity items (P1>P2>P3); returns {kept, dropped}. */
export function capBySeverity(findings, max) {
  if (!Array.isArray(findings) || findings.length <= max) return { kept: findings || [], dropped: 0 }
  const order = { P1: 0, P2: 1, P3: 2 }
  const sorted = [...findings].sort((a, b) => (order[a && a.severity] ?? 3) - (order[b && b.severity] ?? 3))
  return { kept: sorted.slice(0, max), dropped: findings.length - max }
}
