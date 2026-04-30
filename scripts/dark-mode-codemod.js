#!/usr/bin/env node
/**
 * Dark-mode codemod — replaces hardcoded color tokens with theme-aware references.
 * Only matches tokens in clearly "style" contexts to avoid touching data/icon strings.
 *
 * Usage: node scripts/dark-mode-codemod.js <file1> <file2> ...
 *        node scripts/dark-mode-codemod.js --dry <file>   # preview
 */
const fs = require('fs');
const path = require('path');

// Safe one-way substitutions. Order matters (longer/more specific first).
// Each entry: [pattern: RegExp, replacement: string, description]
const RULES = [
  // backgroundColor
  [/backgroundColor:\s*'#ffffff'/g,      "backgroundColor: colors.card",                "bg white -> card"],
  [/backgroundColor:\s*'#fff'/g,         "backgroundColor: colors.card",                "bg white -> card"],
  [/backgroundColor:\s*'#f9fafb'/g,      "backgroundColor: colors.background.secondary", "bg light gray -> secondary"],
  [/backgroundColor:\s*'#f3f4f6'/g,      "backgroundColor: colors.background.tertiary",  "bg mid gray -> tertiary"],

  // text color — with "color: "
  [/color:\s*'#111418'/g,                "color: colors.text.primary",     "text primary"],
  [/color:\s*'#111827'/g,                "color: colors.text.primary",     "text primary alt"],
  [/color:\s*'#1f2937'/g,                "color: colors.text.primary",     "text primary alt2"],
  [/color:\s*'#374151'/g,                "color: colors.text.secondary",   "text secondary"],
  [/color:\s*'#4b5563'/g,                "color: colors.text.secondary",   "text secondary alt"],
  [/color:\s*'#6b7280'/g,                "color: colors.text.secondary",   "text secondary alt2"],
  [/color:\s*'#9ca3af'/g,                "color: colors.text.muted",       "text muted"],
  [/color:\s*'#d1d5db'/g,                "color: colors.text.muted",       "text muted alt"],

  // Ternary patterns on 'color' / 'backgroundColor' / 'borderColor':
  // `: '#hex'` followed by `,` or `)` or `}` — typical ternary RHS or object literal value.
  // Avoids array elements like `['#hex', ...]` because those start with `[` or are preceded by other array context (not `: `)
  [/:\s*'#111418'(\s*[,})])/g,          ": colors.text.primary$1",      "text primary (ternary/style)"],
  [/:\s*'#374151'(\s*[,})])/g,          ": colors.text.secondary$1",    "text secondary (ternary/style)"],
  [/:\s*'#6b7280'(\s*[,})])/g,          ": colors.text.secondary$1",    "text secondary alt (ternary/style)"],
  [/:\s*'#9ca3af'(\s*[,})])/g,          ": colors.text.muted$1",        "text muted (ternary/style)"],
  [/:\s*'#d1d5db'(\s*[,})])/g,          ": colors.text.muted$1",        "text muted alt (ternary/style)"],

  // borderColor / borderBottomColor / borderTopColor / borderLeftColor / borderRightColor
  [/borderBottomColor:\s*'#f3f4f6'/g,    "borderBottomColor: colors.borderLight", "border light bottom"],
  [/borderBottomColor:\s*'#e5e7eb'/g,    "borderBottomColor: colors.border",      "border bottom"],
  [/borderTopColor:\s*'#f3f4f6'/g,       "borderTopColor: colors.borderLight",    "border light top"],
  [/borderTopColor:\s*'#e5e7eb'/g,       "borderTopColor: colors.border",         "border top"],
  [/borderColor:\s*'#f3f4f6'/g,          "borderColor: colors.borderLight",       "border light all"],
  [/borderColor:\s*'#e5e7eb'/g,          "borderColor: colors.border",            "border all"],

  // placeholderTextColor (JSX attribute, string literal)
  [/placeholderTextColor="#9ca3af"/g,    'placeholderTextColor={colors.text.muted}', "placeholder muted"],
  [/placeholderTextColor="#6b7280"/g,    'placeholderTextColor={colors.text.secondary}', "placeholder secondary"],
  [/placeholderTextColor='#9ca3af'/g,    "placeholderTextColor={colors.text.muted}", "placeholder muted alt"],

  // Pastel backgrounds (tint variants) — map to semantic tokens with alpha suffix
  [/backgroundColor:\s*'#fef2f2'/g,     "backgroundColor: colors.error + '14'",          "bg error tint"],
  [/backgroundColor:\s*'#fecaca'/g,     "backgroundColor: colors.error + '30'",          "bg error stronger tint"],
  [/backgroundColor:\s*'#f0fdf4'/g,     "backgroundColor: colors.success + '14'",        "bg success tint"],
  [/backgroundColor:\s*'#dcfce7'/g,     "backgroundColor: colors.success + '22'",        "bg success mid tint"],
  [/backgroundColor:\s*'#fffbeb'/g,     "backgroundColor: colors.warning + '14'",        "bg warning tint"],
  [/backgroundColor:\s*'#fef3c7'/g,     "backgroundColor: colors.warning + '22'",        "bg warning mid tint"],
  [/backgroundColor:\s*'#f3f0ff'/g,     "backgroundColor: Colors.primary + '14'",        "bg primary tint"],
  [/backgroundColor:\s*'#ede9fe'/g,     "backgroundColor: Colors.primary + '22'",        "bg primary mid tint"],
  [/backgroundColor:\s*'#eef2ff'/g,     "backgroundColor: Colors.primary + '14'",        "bg primary indigo tint"],

  // Dark destructive text variants
  [/color:\s*'#dc2626'/g,                "color: colors.error",                     "text error alt"],
  [/color:\s*'#15803d'/g,                "color: colors.success",                   "text success dark"],

  // Destructive / error family — map all red variants to colors.error
  [/color:\s*'#ef4444'/g,                "color: colors.error",                     "destructive text"],
  [/backgroundColor:\s*'#ef4444'/g,      "backgroundColor: colors.error",           "destructive bg"],
  // Success family
  [/color:\s*'#22c55e'/g,                "color: colors.success",                   "success text"],
  [/color:\s*'#16a34a'/g,                "color: colors.success",                   "success text alt"],
  [/backgroundColor:\s*'#22c55e'/g,      "backgroundColor: colors.success",         "success bg"],

  // JSX attr icon colors: `color="#ef4444"` → `color={colors.error}`
  [/color="#ef4444"/g,                  'color={colors.error}',                      "icon error dbl-quote"],
  [/color="#dc2626"/g,                  'color={colors.error}',                      "icon error alt dbl-quote"],
  [/color="#22c55e"/g,                  'color={colors.success}',                    "icon success dbl-quote"],
  [/color="#16a34a"/g,                  'color={colors.success}',                    "icon success alt dbl-quote"],
  [/color="#9ca3af"/g,                  'color={colors.text.muted}',                 "icon muted dbl-quote"],
  [/color="#6b7280"/g,                  'color={colors.text.secondary}',             "icon secondary dbl-quote"],
  [/color="#374151"/g,                  'color={colors.text.secondary}',             "icon secondary alt dbl-quote"],
  [/color="#111418"/g,                  'color={colors.text.primary}',               "icon primary dbl-quote"],
  [/color="#d1d5db"/g,                  'color={colors.text.muted}',                 "icon muted alt dbl-quote"],

  // Color attribute (MCI icon color) single-quote literal form
  [/color=\{'#ef4444'\}/g,               "color={colors.error}",                    "icon destructive sq"],
  [/color=\{'#dc2626'\}/g,               "color={colors.error}",                    "icon destructive alt sq"],
  [/color=\{'#22c55e'\}/g,               "color={colors.success}",                  "icon success sq"],
];


function transform(source) {
  let out = source;
  const changes = [];
  for (const [pattern, replacement, desc] of RULES) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (before !== out) {
      const count = (before.match(pattern) || []).length;
      changes.push({ desc, count });
    }
  }
  return { out, changes };
}

function ensureUseThemeImport(source) {
  // Skip if already uses useTheme
  if (/useTheme\s*\(\s*\)/.test(source)) return { source, added: false };
  // Skip if file doesn't import from constants/theme (probably not a RN component)
  if (!/from\s+['"][^'"]+constants\/theme['"]/.test(source)) return { source, added: false };

  // Insert import next to existing theme import
  source = source.replace(
    /(import\s+\{[^}]+\}\s+from\s+['"])(\.[^'"]+)(\/constants\/theme['"];?)/,
    (m, pre, prefix, suf) => {
      // Insert useTheme import right BEFORE the theme constants import
      // We can derive the path: prefix is like "../../.." to reach mobile root
      const relBase = prefix.replace(/\/constants\/theme$/, '');
      const hooksPath = `${relBase}/hooks/useTheme`;
      return `import { useTheme } from '${hooksPath}';\n${m}`;
    }
  );

  // Insert `const { colors } = useTheme();` inside the first function component's body
  // Matches: `export default function X()`, `export function X()`, or `export const X = (..) =>`
  const patterns = [
    /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
    /(export\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
    /(export\s+const\s+\w+\s*:\s*[^=]*=\s*\([^)]*\)\s*=>\s*\{)/,
  ];
  for (const p of patterns) {
    const m = source.match(p);
    if (m) {
      if (!/const\s*\{\s*colors\s*\}\s*=\s*useTheme/.test(source)) {
        source = source.replace(m[1], `${m[1]}\n  const { colors } = useTheme();`);
      }
      break;
    }
  }

  return { source, added: true };
}

function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const files = args.filter((a) => a !== '--dry');

  if (files.length === 0) {
    console.error('Usage: node dark-mode-codemod.js [--dry] <file>...');
    process.exit(1);
  }

  let totalChanges = 0;
  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.warn(`skip (not found): ${file}`);
      continue;
    }
    const src = fs.readFileSync(abs, 'utf8');
    const { out: transformed, changes } = transform(src);
    // Only ensure useTheme() import/call if substitutions actually introduced `colors.*`
    const needsTheme = transformed !== src && /\bcolors\./.test(transformed);
    const { source: final, added: addedTheme } = needsTheme
      ? ensureUseThemeImport(transformed)
      : { source: transformed, added: false };

    if (transformed === src) {
      console.log(`· no changes: ${path.relative(process.cwd(), abs)}`);
      continue;
    }

    const changeSummary = changes.map((c) => `${c.desc}×${c.count}`).join(', ');
    totalChanges += changes.reduce((s, c) => s + c.count, 0);
    console.log(`✎ ${path.relative(process.cwd(), abs)}: ${changeSummary}${addedTheme ? ' [+useTheme]' : ''}`);

    if (!dry) {
      fs.writeFileSync(abs, final, 'utf8');
    }
  }
  console.log(`\n${dry ? '(dry-run) ' : ''}Total substitutions: ${totalChanges}`);
}

main();
