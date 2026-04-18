import re

lines = open('App.tsx', 'r', encoding='utf-8').readlines()
app_keys = set()
pattern = re.compile(r"""t\(['"]([a-zA-Z0-9_.]+)['"]\s*[,)]""")
for l in lines:
    for m in pattern.finditer(l):
        k = m.group(1)
        if '.' in k:
            app_keys.add(k)

zh_text = open('src/i18n/zh.ts', 'r', encoding='utf-8').read()
zh_keys = set(re.findall(r"'([a-zA-Z0-9_.]+)'\s*:", zh_text))

en_text = open('src/i18n/en.ts', 'r', encoding='utf-8').read()
en_keys = set(re.findall(r"'([a-zA-Z0-9_.]+)'\s*:", en_text))

missing_zh = sorted(app_keys - zh_keys)
missing_en = sorted(app_keys - en_keys)

if missing_zh:
    print(f'Missing {len(missing_zh)} keys in zh.ts:')
    for k in missing_zh:
        print(f'  {k}')
else:
    print(f'All {len(app_keys)} App.tsx keys found in zh.ts')

if missing_en:
    print(f'Missing {len(missing_en)} keys in en.ts:')
    for k in missing_en:
        print(f'  {k}')
else:
    print(f'All {len(app_keys)} App.tsx keys found in en.ts')
