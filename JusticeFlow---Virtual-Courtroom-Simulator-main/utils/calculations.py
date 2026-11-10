"""Utility helpers for scheduler and memory metrics."""

from __future__ import annotations

from typing import Dict, Iterable, List


def average(values: Iterable[float]) -> float:
    """Return average value, or 0.0 for empty input."""
    items = list(values)
    return (sum(items) / len(items)) if items else 0.0


def metrics_averages(metrics: List[Dict[str, float]]) -> Dict[str, float]:
    """Compute average waiting and turnaround from per-case metrics."""
    return {
        "avg_waiting": average(float(m.get("waiting_time", 0.0)) for m in metrics),
        "avg_turnaround": average(float(m.get("turnaround", 0.0)) for m in metrics),
    }


__all__ = ["average", "metrics_averages"]

