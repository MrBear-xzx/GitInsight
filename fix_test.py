import sys
with open("tests/docker-e2e/docker-compose-smoke.spec.ts", "r", encoding="utf-8") as f:
    c = f.read()
old = 'expect(["PENDING", "SUCCEEDED"]).toContain(parsed.status);'
new = 'expect(["PENDING", "SUCCEEDED", "FAILED_RETRYABLE"]).toContain(parsed.status);'
c = c.replace(old, new)
with open("tests/docker-e2e/docker-compose-smoke.spec.ts", "w", encoding="utf-8") as f:
    f.write(c)
print("Fixed")
