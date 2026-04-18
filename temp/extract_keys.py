import re

lines = open('App.tsx', 'r', encoding='utf-8').readlines()
keys = set()
pattern = re.compile(r"""t\(['"]([a-zA-Z0-9_.]+)['"]\s*[,)]""")
for l in lines:
    for m in pattern.finditer(l):
        keys.add(m.group(1))

print(f'Total unique t() keys: {len(keys)}')
for k in sorted(keys):
    print(k)
