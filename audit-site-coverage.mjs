import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Normalize spelling width and spacing, without fuzzy matching different people. */
function normalize(name) {
  return String(name).normalize('NFKC').replace(/\s/g, '').toLowerCase();
}

/** Find website artists and members missing from a glossary; report translation differences separately. */
export function auditCoverage(groups, glossary) {
  const active = glossary.talents.filter(t => !t.disabled);
  const missingArtists = [], missingMembers = [], translationDifferences = [], memberTranslationDifferences = [];
  for (const group of groups) {
    const names = new Set([group.jp, ...(group.glossaryAliases || [])].map(normalize));
    const matches = active.filter(t => (t.group ? t.group.jp : t.members.flatMap(m => m.jp)).some(a => names.has(normalize(a))));
    if (matches.length !== 1) {
      missingArtists.push({ id: group.id, jp: group.jp, matches: matches.length });
      continue;
    }
    const unit = matches[0];
    const zh = unit.group?.zh || unit.members[0].zh;
    if (zh !== group.zh) translationDifferences.push({ id: group.id, website: group.zh, glossary: zh });
    for (const member of group.members) {
      const aliases = new Set([member.glossaryJp || member.jp, ...(member.glossaryAliases || [])].map(normalize));
      const match = unit.members.find(m => !m.disabled && m.jp.some(a => aliases.has(normalize(a))));
      if (!match) {
        missingMembers.push({ id: group.id, jp: member.jp });
      } else if (match.zh !== member.zh) {
        memberTranslationDifferences.push({ id: group.id, jp: member.jp, website: member.zh, glossary: match.zh });
      }
    }
  }
  return { artists: groups.length, missingArtists, missingMembers, translationDifferences, memberTranslationDifferences };
}

/** Read JSON from a public URL or an explicitly supplied local filename. */
async function json(source) {
  if (!source.startsWith('https://')) return JSON.parse(await readFile(source, 'utf8'));
  const response = await fetch(source);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const glossary = await json(process.argv[2] || new URL('./glossary.json', import.meta.url).pathname);
  const site = await json(process.argv[3] || 'https://allen365apple.github.io/JPComedy/data.json');
  const report = auditCoverage(site.groups, glossary.data || glossary);
  console.log(JSON.stringify(report, null, 2));
  if (report.missingArtists.length || report.missingMembers.length) process.exitCode = 1;
}
