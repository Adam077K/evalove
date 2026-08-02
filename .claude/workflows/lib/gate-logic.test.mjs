import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeArgs, isConfirmed, decideVerdict, capBySeverity, isBlockEligible } from './gate-logic.mjs'

test('isBlockEligible: P1 always eligible', () => {
  assert.equal(isBlockEligible('P1', 'full'), true)
  assert.equal(isBlockEligible('P1', 'irreversible'), true)
})
test('isBlockEligible: P2 eligible only at irreversible', () => {
  assert.equal(isBlockEligible('P2', 'full'), false)
  assert.equal(isBlockEligible('P2', 'irreversible'), true)
})
test('isBlockEligible: P3 never eligible', () => {
  assert.equal(isBlockEligible('P3', 'full'), false)
  assert.equal(isBlockEligible('P3', 'irreversible'), false)
})

test('normalizeArgs: object passes through', () => {
  assert.deepEqual(normalizeArgs({ tier: 'full' }), { tier: 'full' })
})
test('normalizeArgs: JSON string is parsed', () => {
  assert.deepEqual(normalizeArgs('{"tier":"irreversible","ref":"HEAD~1"}'), { tier: 'irreversible', ref: 'HEAD~1' })
})
test('normalizeArgs: bad string -> {}', () => {
  assert.deepEqual(normalizeArgs('not json'), {})
})
test('normalizeArgs: undefined/null -> {}', () => {
  assert.deepEqual(normalizeArgs(undefined), {})
  assert.deepEqual(normalizeArgs(null), {})
})

test('isConfirmed: no votes -> false', () => {
  assert.equal(isConfirmed([]), false)
  assert.equal(isConfirmed([null, null]), false)
})
test('isConfirmed: lone 1-of-1 real -> false (quorum)', () => {
  assert.equal(isConfirmed([{ is_real: true }]), false)
})
test('isConfirmed: 1-of-2 tie -> false', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: false }]), false)
})
test('isConfirmed: 2-of-2 -> true', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }]), true)
})
test('isConfirmed: 2-of-3 -> true', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }, { is_real: false }]), true)
})
test('isConfirmed: 1-of-3 -> false', () => {
  assert.equal(isConfirmed([{ is_real: true }, { is_real: false }, { is_real: false }]), false)
})
test('isConfirmed: tolerates a dropped (null) verifier', () => {
  // 2 cast, both real -> confirmed even though a 3rd dropped
  assert.equal(isConfirmed([{ is_real: true }, { is_real: true }, null]), true)
})

test('decideVerdict: confirmed P1 -> BLOCK even if judge says PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P1' }], judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: critical coverage gap -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [], failedDims: ['security'], judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: full tier, P2 only, judge PASS -> PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P2' }], tier: 'full', judgeVerdict: 'PASS' }), 'PASS')
})
test('decideVerdict: irreversible tier, P2 -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P2' }], tier: 'irreversible', judgeVerdict: 'PASS' }), 'BLOCK')
})
test('decideVerdict: clean + judge BLOCK -> BLOCK', () => {
  assert.equal(decideVerdict({ confirmed: [], judgeVerdict: 'BLOCK' }), 'BLOCK')
})
test('decideVerdict: clean + judge PASS -> PASS', () => {
  assert.equal(decideVerdict({ confirmed: [{ severity: 'P3' }], judgeVerdict: 'PASS' }), 'PASS')
})
test('decideVerdict: non-critical dim gap does NOT block on its own', () => {
  assert.equal(decideVerdict({ confirmed: [], failedDims: ['perf'], judgeVerdict: 'PASS' }), 'PASS')
})

test('capBySeverity: under cap returns all, 0 dropped', () => {
  const f = [{ severity: 'P1' }, { severity: 'P2' }]
  assert.deepEqual(capBySeverity(f, 5), { kept: f, dropped: 0 })
})
test('capBySeverity: over cap keeps highest severity first', () => {
  const f = [{ severity: 'P3', id: 'a' }, { severity: 'P1', id: 'b' }, { severity: 'P2', id: 'c' }]
  const { kept, dropped } = capBySeverity(f, 2)
  assert.equal(dropped, 1)
  assert.deepEqual(kept.map(x => x.id), ['b', 'c'])
})
