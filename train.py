"""Reproducible fine-tuning entry point for support-ticket classification.

The default production profile trains only category and priority. Sentiment is
opt-in because the supplied sentiment values are machine-assisted and should
not be used for automated routing without human-reviewed labels.
"""
from __future__ import annotations

import argparse
import json
import random
from dataclasses import asdict
from pathlib import Path
from typing import Dict, List, Mapping, Sequence

import numpy as np
import torch
from torch.utils.data import Dataset
from transformers import AutoTokenizer, DataCollatorWithPadding, Trainer, TrainingArguments, set_seed

from .model import MultiTaskDistilBERT, TicketModelConfig

ALL_TASKS = ("category", "sentiment", "priority")


def read_jsonl(path: str | Path) -> List[dict]:
    rows = [json.loads(line) for line in Path(path).open(encoding="utf-8") if line.strip()]
    required = {"subject", "body"}
    if rows and not required.issubset(rows[0]):
        raise ValueError("Each row must contain subject and body")
    if any(not isinstance(row.get("subject"), str) or not isinstance(row.get("body"), str) for row in rows):
        raise ValueError("subject and body must be strings")
    return rows


def build_label_maps(rows: List[dict], tasks: Sequence[str]) -> Dict[str, Dict]:
    maps = {}
    for task in ALL_TASKS:
        labels = sorted({str(row[task]) for row in rows if task in tasks and row.get(task) not in (None, "")})
        maps[task] = {
            "label2id": {label: i for i, label in enumerate(labels)},
            "id2label": {str(i): label for i, label in enumerate(labels)},
        }
    return maps


class TicketDataset(Dataset):
    def __init__(self, rows: List[dict], tokenizer, label_maps: Mapping, tasks: Sequence[str], max_length: int = 256):
        self.rows, self.tokenizer, self.label_maps = rows, tokenizer, label_maps
        self.tasks, self.max_length = set(tasks), max_length

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        item = self.tokenizer(f"Subject: {row['subject']}\n\n{row['body']}", truncation=True, max_length=self.max_length)
        for task in ALL_TASKS:
            value = row.get(task)
            item[f"{task}_labels"] = (
                self.label_maps[task]["label2id"].get(str(value), -100)
                if task in self.tasks and value not in (None, "") else -100
            )
        return item


def _accuracy_and_macro_f1(predictions: np.ndarray, labels: np.ndarray) -> tuple[float, float]:
    valid = labels != -100
    if not np.any(valid):
        return float("nan"), float("nan")
    y_pred, y_true = predictions[valid], labels[valid]
    accuracy = float((y_pred == y_true).mean())
    f1_values = []
    for cls in np.unique(y_true):
        tp = np.sum((y_pred == cls) & (y_true == cls))
        fp = np.sum((y_pred == cls) & (y_true != cls))
        fn = np.sum((y_pred != cls) & (y_true == cls))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1_values.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return accuracy, float(np.mean(f1_values))


def make_metrics(tasks: Sequence[str]):
    def compute_metrics(eval_prediction):
        predictions, labels = eval_prediction
        if isinstance(predictions, tuple): predictions = predictions[:3]
        if isinstance(labels, tuple): labels = labels[:3]
        result = {}
        f1_values = []
        for task, logits, target in zip(ALL_TASKS, predictions, labels):
            accuracy, macro_f1 = _accuracy_and_macro_f1(np.argmax(logits, axis=-1), target)
            if task in tasks and not np.isnan(macro_f1):
                result[f"{task}_accuracy"] = accuracy
                result[f"{task}_macro_f1"] = macro_f1
                f1_values.append(macro_f1)
        result["mean_macro_f1"] = float(np.mean(f1_values)) if f1_values else 0.0
        return result
    return compute_metrics


def train(args) -> None:
    tasks = tuple(dict.fromkeys(args.tasks))
    unknown = set(tasks) - set(ALL_TASKS)
    if unknown or not tasks:
        raise ValueError(f"--tasks must contain one or more of {ALL_TASKS}; unknown={sorted(unknown)}")
    train_rows, eval_rows = read_jsonl(args.train_file), read_jsonl(args.eval_file)
    if not train_rows or not eval_rows:
        raise ValueError("Training and evaluation files must both contain records")
    label_maps = build_label_maps(train_rows, tasks)
    for task in tasks:
        if not label_maps[task]["label2id"]:
            raise ValueError(f"No labels found for enabled task: {task}")
    set_seed(args.seed)
    random.seed(args.seed); np.random.seed(args.seed); torch.manual_seed(args.seed)
    ticket_config = TicketModelConfig(
        backbone=args.backbone,
        num_categories=max(1, len(label_maps["category"]["label2id"])),
        num_sentiments=max(1, len(label_maps["sentiment"]["label2id"])),
        num_priorities=max(1, len(label_maps["priority"]["label2id"])),
    )
    tokenizer = AutoTokenizer.from_pretrained(args.backbone)
    model = MultiTaskDistilBERT.from_backbone(ticket_config)
    train_dataset = TicketDataset(train_rows, tokenizer, label_maps, tasks, args.max_length)
    eval_dataset = TicketDataset(eval_rows, tokenizer, label_maps, tasks, args.max_length)
    training_args = TrainingArguments(
        output_dir=args.output_dir, learning_rate=args.learning_rate,
        per_device_train_batch_size=args.train_batch_size, per_device_eval_batch_size=args.eval_batch_size,
        num_train_epochs=args.epochs, weight_decay=args.weight_decay, seed=args.seed,
        eval_strategy="epoch", save_strategy="epoch", save_total_limit=2,
        load_best_model_at_end=True, metric_for_best_model="mean_macro_f1", greater_is_better=True,
        report_to="none", logging_strategy="steps", logging_steps=max(1, args.logging_steps),
        fp16=args.fp16 and torch.cuda.is_available(), dataloader_num_workers=args.num_workers,
    )
    trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset, eval_dataset=eval_dataset,
                      processing_class=tokenizer, data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
                      compute_metrics=make_metrics(tasks))
    trainer.train()
    metrics = trainer.evaluate()
    model.save_ticket_pretrained(args.output_dir, label_maps)
    tokenizer.save_pretrained(args.output_dir)
    manifest = {"tasks": list(tasks), "seed": args.seed, "train_records": len(train_rows),
                "eval_records": len(eval_rows), "metrics": metrics, "backbone": args.backbone,
                "max_length": args.max_length, "training_args": vars(args)}
    (Path(args.output_dir) / "training_manifest.json").write_text(json.dumps(manifest, indent=2, default=str), encoding="utf-8")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train-file", required=True); parser.add_argument("--eval-file", required=True); parser.add_argument("--output-dir", required=True)
    parser.add_argument("--backbone", default="distilbert/distilbert-base-uncased"); parser.add_argument("--max-length", type=int, default=256)
    parser.add_argument("--learning-rate", type=float, default=2e-5); parser.add_argument("--train-batch-size", type=int, default=16); parser.add_argument("--eval-batch-size", type=int, default=16)
    parser.add_argument("--epochs", type=float, default=3.0); parser.add_argument("--weight-decay", type=float, default=0.01); parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--tasks", nargs="+", choices=ALL_TASKS, default=["category", "priority"])
    parser.add_argument("--logging-steps", type=int, default=50); parser.add_argument("--num-workers", type=int, default=0); parser.add_argument("--fp16", action="store_true")
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
