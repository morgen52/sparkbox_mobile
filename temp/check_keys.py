import re, sys

# Extract keys from App.tsx
lines = open('App.tsx', 'r', encoding='utf-8').readlines()
app_keys = set()
pattern = re.compile(r"""t\(['"]([a-zA-Z0-9_.]+)['"]\s*[,)]""")
for l in lines:
    for m in pattern.finditer(l):
        app_keys.add(m.group(1))

# Extract keys from zh.ts
zh_lines = open('src/i18n/zh.ts', 'r', encoding='utf-8').read()
zh_keys = set(re.findall(r"""['\"]([a-zA-Z0-9_.]+)['"]\s*:""", zh_lines))

missing = sorted(app_keys - zh_keys)
if missing:
    print(f'Missing {len(missing)} keys in zh.ts:')
    for k in missing:
        print(f'  {k}')
else:
    print('All App.tsx keys found in zh.ts')

# Also check en.ts
en_lines = open('src/i18n/en.ts', 'r', encoding='utf-8').read()
en_keys = set(re.findall(r"""['\"]([a-zA-Z0-9_.]+)['"]\s*:""", en_lines))

missing_en = sorted(app_keys - en_keys)
if missing_en:
    print(f'\nMissing {len(missing_en)} keys in en.ts:')
    for k in missing_en:
        print(f'  {k}')
else:
    print('All App.tsx keys found in en.ts')
