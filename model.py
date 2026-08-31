"""Multi-task DistilBERT for support-ticket classification."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, Mapping, Optional

import torch
from torch import nn
from transformers import DistilBertModel, DistilBertPreTrainedModel


@dataclass
class TicketModelConfig:
    backbone: str = "distilbert/distilbert-base-uncased"
    num_categories: int = 8
    num_sentiments: int = 3
    num_priorities: int = 4
    dropout: float = 0.2
    category_loss_weight: float = 1.0
    sentiment_loss_weight: float = 0.5
    priority_loss_weight: float = 0.5
    category_threshold: float = 0.60
    sentiment_threshold: float = 0.60
    priority_threshold: float = 0.60


class MultiTaskDistilBERT(DistilBertPreTrainedModel):
    """One DistilBERT encoder with three supervised ticket heads.

    The model accepts the standard tokenizer tensors (`input_ids` and
    `attention_mask`) and optional integer labels named `category_labels`,
    `sentiment_labels`, and `priority_labels`. Labels may contain -100 to mask
    an unavailable task label, matching PyTorch cross-entropy conventions.
    """

    def __init__(self, config, ticket_config: Optional[TicketModelConfig] = None):
        super().__init__(config)
        self.ticket_config = ticket_config or TicketModelConfig()
        self.distilbert = DistilBertModel(config)
        hidden = config.dim
        self.dropout = nn.Dropout(self.ticket_config.dropout)
        self.category_classifier = nn.Linear(hidden, self.ticket_config.num_categories)
        self.sentiment_classifier = nn.Linear(hidden, self.ticket_config.num_sentiments)
        self.priority_classifier = nn.Linear(hidden, self.ticket_config.num_priorities)
        self.post_init()

    @classmethod
    def from_backbone(cls, ticket_config: TicketModelConfig) -> "MultiTaskDistilBERT":
        model = cls.from_pretrained(
            ticket_config.backbone,
            ticket_config=ticket_config,
            num_labels=ticket_config.num_categories,
        )
        return model

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        category_labels: Optional[torch.Tensor] = None,
        sentiment_labels: Optional[torch.Tensor] = None,
        priority_labels: Optional[torch.Tensor] = None,
        **kwargs,
    ) -> Dict[str, torch.Tensor]:
        outputs = self.distilbert(
            input_ids=input_ids,
            attention_mask=attention_mask,
            **kwargs,
        )
        # DistilBERT has no pooler. The first token representation is the
        # sequence representation used by the official classification head.
        pooled = self.dropout(outputs.last_hidden_state[:, 0])
        logits = {
            "category_logits": self.category_classifier(pooled),
            "sentiment_logits": self.sentiment_classifier(pooled),
            "priority_logits": self.priority_classifier(pooled),
        }
        labels = {
            "category": category_labels,
            "sentiment": sentiment_labels,
            "priority": priority_labels,
        }
        weights = {
            "category": self.ticket_config.category_loss_weight,
            "sentiment": self.ticket_config.sentiment_loss_weight,
            "priority": self.ticket_config.priority_loss_weight,
        }
        losses = []
        for task, label in labels.items():
            if label is not None and torch.any(label != -100):
                task_loss = nn.functional.cross_entropy(
                    logits[f"{task}_logits"], label, ignore_index=-100
                )
                losses.append(weights[task] * task_loss)
        result: Dict[str, torch.Tensor] = {**logits}
        if losses:
            result["loss"] = torch.stack(losses).sum()
        return result

    def save_ticket_pretrained(self, directory: str | Path, label_maps: Optional[Mapping[str, Mapping]] = None) -> None:
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        self.save_pretrained(path)
        (path / "ticket_config.json").write_text(
            json.dumps(asdict(self.ticket_config), indent=2), encoding="utf-8"
        )
        if label_maps is not None:
            (path / "label_maps.json").write_text(
                json.dumps(label_maps, indent=2), encoding="utf-8"
            )

    @classmethod
    def from_ticket_pretrained(cls, directory: str | Path) -> "MultiTaskDistilBERT":
        path = Path(directory)
        ticket_config = TicketModelConfig(**json.loads((path / "ticket_config.json").read_text()))
        return cls.from_pretrained(path, ticket_config=ticket_config)
