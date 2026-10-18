import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCoverage } from './audit-site-coverage.mjs';

const group = { id: 'example', jp: '組合', zh: '組合譯名', members: [{ jp: '甲' }, { jp: '乙' }] };
const unit = { group: { jp: ['組合'], zh: '組合譯名' }, members: [{ jp: ['甲'], zh: '甲' }, { jp: ['乙'], zh: '乙' }] };

test('missing group name fails even when member names already exist', () => {
  const result = auditCoverage([group], { talents: [{ ...unit, group: null }] });
  assert.equal(result.missingArtists.length, 1);
});
test('missing member fails independently from group coverage', () => {
  const result = auditCoverage([group], { talents: [{ ...unit, members: unit.members.slice(0, 1) }] });
  assert.deepEqual(result.missingMembers, [{ id: 'example', jp: '乙' }]);
});
test('canonical aliases resolve members without replacing manual translations', () => {
  const edited = { ...unit, group: { ...unit.group, zh: '雲端人工譯名' } };
  const result = auditCoverage([group], { talents: [edited] });
  assert.equal(result.missingArtists.length + result.missingMembers.length, 0);
  assert.equal(result.translationDifferences.length, 1);
  assert.equal(edited.group.zh, '雲端人工譯名');
});
test('disabled and ambiguous identities are not reported as covered', () => {
  assert.equal(auditCoverage([group], { talents: [{ ...unit, disabled: true }] }).missingArtists.length, 1);
  assert.equal(auditCoverage([group], { talents: [{ ...unit, group: { ...unit.group, disabled: true } }] }).missingArtists.length, 1);
  assert.equal(auditCoverage([group], { talents: [unit, unit] }).missingArtists.length, 1);
});
