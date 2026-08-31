from __future__ import annotations
import json
from collections import Counter
from pathlib import Path

root = Path(__file__).parent
splits = {}
for name in ("train", "valid"):
    rows = [json.loads(line) for line in (root / "data/combined" / f"{name}.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    splits[name] = rows
    print(f"{name}_count={len(rows)}")
    for field in ("category", "priority", "sentiment", "source_dataset"):
        print(field, Counter(row.get(field) for row in rows).most_common(12))
    missing = {field: sum(not row.get(field) for row in rows) for field in ("subject", "body", "category", "priority", "sentiment")}
    print("missing", missing)
    keys = [(row.get("subject"), row.get("body"), row.get("category")) for row in rows]
    print("duplicate_keys", len(keys) - len(set(keys)))

train_keys = {(row.get("subject"), row.get("body"), row.get("category")) for row in splits["train"]}
valid_keys = {(row.get("subject"), row.get("body"), row.get("category")) for row in splits["valid"]}
print("cross_split_overlap", len(train_keys & valid_keys))
