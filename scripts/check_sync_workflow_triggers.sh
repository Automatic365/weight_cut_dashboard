#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_FILE=".github/workflows/sync-data.yml"

if [[ ! -f "${WORKFLOW_FILE}" ]]; then
  echo "ERROR: ${WORKFLOW_FILE} is missing."
  exit 1
fi

if ! rg -q '^\s*schedule\s*:' "${WORKFLOW_FILE}"; then
  echo "ERROR: sync-data workflow must define an on.schedule trigger."
  exit 1
fi

if ! rg -q '^\s*workflow_dispatch\s*:' "${WORKFLOW_FILE}"; then
  echo "ERROR: sync-data workflow must define an on.workflow_dispatch trigger."
  exit 1
fi

if ! rg -q '^\s*repository_dispatch\s*:' "${WORKFLOW_FILE}"; then
  echo "ERROR: sync-data workflow must define an on.repository_dispatch trigger."
  exit 1
fi

if ! rg -q 'types:\s*\[update_logs\]' "${WORKFLOW_FILE}"; then
  echo "ERROR: sync-data workflow repository_dispatch trigger must include update_logs type."
  exit 1
fi

echo "sync-data workflow trigger guard passed."
