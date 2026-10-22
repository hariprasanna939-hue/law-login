import re
import json

with open("reference_audit/live_assets/index.js", "r") as f:
    content = f.read()

print("Length:", len(content))

urls = set(re.findall(r'https?://[^\s"\'`]+', content))
print("Urls:")
for u in sorted(urls):
    if "w3.org" not in u and "react" not in u:
        print(" ", u)

keywords = set(re.findall(r'LND-[\w\-]+|Ami\s+[\w\s]+|Advocate\s+[\w\s]+|Legal Due Diligence', content))
print("\nKeywords:")
for k in sorted(keywords):
    print(" ", k)
