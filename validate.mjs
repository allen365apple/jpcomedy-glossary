/** Check the shared glossary before accepting community edits. */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const raw = readFileSync(new URL('./glossary.json', import.meta.url));
assert(raw.length <= 2_000_000, '詞庫超過大小上限');
const data = JSON.parse(raw);
assert(Array.isArray(data.talents) && Array.isArray(data.others), '缺少詞庫分類');
function entry(item) {
  assert(item && Array.isArray(item.jp) && item.jp.length, '缺少日文名稱');
  assert(item.jp.every(name => typeof name === 'string' && name.trim()), '日文名稱不可空白');
  assert(typeof item.zh === 'string' && item.zh.trim(), '缺少繁中譯名');
  if ('disabled' in item) assert(typeof item.disabled === 'boolean');
  if ('note' in item) assert(typeof item.note === 'string');
}
data.others.forEach(entry);
for (const item of data.talents) {
  if (item.group != null) entry(item.group);
  assert(Array.isArray(item.members) && item.members.length, '至少需要一位成員');
  item.members.forEach(entry);
  if ('disabled' in item) assert(typeof item.disabled === 'boolean');
}
console.log(`詞庫格式正確：${data.talents.length} 個藝人單位、${data.others.length} 個其他詞條`);
