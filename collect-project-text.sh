#!/usr/bin/env bash

set -euo pipefail

OUTPUT_FILE="${1:-project-text-dump.txt}"
SCRIPT_NAME="$(basename "$0")"

should_skip_file() {
  local path="$1"
  local normalized="${path#./}"

  [[ "$normalized" == "$OUTPUT_FILE" ]] && return 0
  [[ "$normalized" == "$SCRIPT_NAME" ]] && return 0

  return 1
}

is_text_file() {
  local path="$1"

  if [[ ! -s "$path" ]]; then
    return 0
  fi

  LC_ALL=C grep -Iq . "$path"
}

: > "$OUTPUT_FILE"

while IFS= read -r -d '' file; do
  if should_skip_file "$file"; then
    continue
  fi

  if ! is_text_file "$file"; then
    continue
  fi

  relative_path="${file#./}"

  {
    printf '// %s\n' "$relative_path"
    cat "$file"
    printf '\n\n'
  } >> "$OUTPUT_FILE"
done < <(
  find . \
    \( -path './.git' -o -path './node_modules' -o -path './dist' -o -path './.idea' \) -prune \
    -o -type f -print0 | sort -z
)

printf 'Saved combined text to %s\n' "$OUTPUT_FILE"
