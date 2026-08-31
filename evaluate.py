"""Evaluate a ticket checkpoint and fail CI when production quality gates are missed."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np

from .inference import TicketPredictor


def read_jsonl(path: str | Path) -> list[dict]:
    return [json.loads(line) for line in Path(path).open(encoding="utf-8") if line.strip()]


def f1_by_label(y_true: list[str], y_pred: list[str]) -> dict[str, float]:
    labels = sorted(set(y_true))
    result = {}
    for label in labels:
        tp = sum(a == label and b == label for a, b in zip(y_true, y_pred))
        fp = sum(a != label and b == label for a, b in zip(y_true, y_pred))
        fn = sum(a == label and b != label for a, b in zip(y_true, y_pred))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        result[label] = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return result


def evaluate(args) -> dict:
    rows = read_jsonl(args.eval_file)
    maps = json.loads((Path(args.model_dir) / "label_maps.json").read_text(encoding="utf-8"))
    predictor = TicketPredictor.from_checkpoint(args.model_dir, label_maps=maps)
    predictions = [predictor.predict(row["subject"], row["body"]) for row in rows]
    report = {"records": len(rows), "tasks": {}, "by_source": defaultdict(dict)}
    for task in ("category", "priority", "sentiment"):
        pairs = [(row.get(task), getattr(prediction, task).label) for row, prediction in zip(rows, predictions) if row.get(task) not in (None, "")]
        if not pairs:
            report["tasks"][task] = {"available": False}
            continue
        true, pred = zip(*pairs)
        per_label = f1_by_label(list(true), list(pred))
        report["tasks"][task] = {"available": True, "count": len(pairs), "accuracy": float(np.mean(np.array(true) == np.array(pred))), "macro_f1": float(np.mean(list(per_label.values()))), "per_label_f1": per_label}
        sources = sorted({row.get("source_dataset", "unknown") for row in rows})
        for source in sources:
            source_pairs = [(row.get(task), getattr(prediction, task).label) for row, prediction in zip(rows, predictions) if row.get("source_dataset", "unknown") == source and row.get(task) not in (None, "")]
            if source_pairs:
                st, sp = zip(*source_pairs)
                sf = f1_by_label(list(st), list(sp))
                report["by_source"].setdefault(source, {})[task] = {"count": len(source_pairs), "accuracy": float(np.mean(np.array(st) == np.array(sp))), "macro_f1": float(np.mean(list(sf.values())))}
    report["by_source"] = dict(report["by_source"])
    Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
    for task, metrics in report["tasks"].items():
        if metrics.get("available") and metrics["macro_f1"] < args.min_macro_f1:
            raise SystemExit(f"quality gate failed: {task} macro_f1={metrics['macro_f1']:.4f} < {args.min_macro_f1:.4f}")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", required=True); parser.add_argument("--eval-file", required=True); parser.add_argument("--report", required=True)
    parser.add_argument("--min-macro-f1", type=float, default=0.70)
    args = parser.parse_args()
    print(json.dumps(evaluate(args), indent=2))


if __name__ == "__main__":
    main()
