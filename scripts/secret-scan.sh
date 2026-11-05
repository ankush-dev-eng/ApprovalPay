#!/usr/bin/env bash
# Fails if an env file is tracked, or if any secret value from .env.local appears in tracked files.
set -uo pipefail
fail=0
if git ls-files | grep -E '(^|/)\.env' | grep -v -E '\.env\.example$'; then
  echo "ERROR: an env file is tracked by git"; fail=1
fi
if [ -f .env.local ]; then
  while IFS='=' read -r key val; do
    [[ -z "${key}" || "${key}" == \#* ]] && continue
    [[ "${key}" =~ (KEY|SECRET|CLIENT_ID) ]] || continue
    val="${val%\"}"; val="${val#\"}"
    [ "${#val}" -lt 8 ] && continue
    if git grep -I -F -q -- "$val" -- . ':!.env.local' 2>/dev/null; then
      echo "ERROR: value of $key appears in tracked files"; fail=1
    fi
  done < .env.local
fi
[ "$fail" -eq 0 ] && echo "secret-scan: OK"
exit $fail