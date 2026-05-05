#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_FILE=".github/workflows/sync-data.yml"

workflow_contains() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    rg -q "${pattern}" "${WORKFLOW_FILE}"
  else
    grep -Eq "${pattern}" "${WORKFLOW_FILE}"
  fi
}

if [[ ! -f "${WORKFLOW_FILE}" ]]; then
  echo "ERROR: ${WORKFLOW_FILE} is missing."
  exit 1
fi

if ! workflow_contains '^[[:space:]]*schedule[[:space:]]*:'; then
  echo "ERROR: sync-data workflow must define an on.schedule trigger."
  exit 1
fi

if ! workflow_contains '^[[:space:]]*workflow_dispatch[[:space:]]*:'; then
  echo "ERROR: sync-data workflow must define an on.workflow_dispatch trigger."
  exit 1
fi

if ! workflow_contains '^[[:space:]]*repository_dispatch[[:space:]]*:'; then
  echo "ERROR: sync-data workflow must define an on.repository_dispatch trigger."
  exit 1
fi

if ! workflow_contains 'types:[[:space:]]*\[update_logs\]'; then
  echo "ERROR: sync-data workflow repository_dispatch trigger must include update_logs type."
  exit 1
fi

echo "sync-data workflow trigger guard passed."
