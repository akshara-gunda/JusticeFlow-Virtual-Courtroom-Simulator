"""Shortest Job First (non-preemptive) scheduling algorithm."""

from __future__ import annotations

from typing import Any, Dict, List

from utils.calculations import metrics_averages


def sjf_schedule(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Schedule by shortest burst among arrived cases."""
    if not cases:
        return {"timeline": [], "metrics": [], "avg_waiting": 0.0, "avg_turnaround": 0.0}

    pending = [
        {
            "case_id": str(c["case_id"]),
            "arrival": float(c["arrival"]),
            "burst": float(c["burst"]),
        }
        for c in cases
    ]
    pending.sort(key=lambda x: (x["arrival"], x["case_id"]))

    timeline = []
    metrics = []
    current_time = min(c["arrival"] for c in pending)

    while pending:
        available = [c for c in pending if c["arrival"] <= current_time]
        if not available:
            current_time = min(c["arrival"] for c in pending)
            available = [c for c in pending if c["arrival"] <= current_time]

        current = min(available, key=lambda c: (c["burst"], c["arrival"], c["case_id"]))
        pending.remove(current)

        start = current_time
        finish = start + current["burst"]
        waiting = start - current["arrival"]
        turnaround = finish - current["arrival"]

        timeline.append({"case_id": current["case_id"], "start": start, "finish": finish})
        metrics.append(
            {
                "case_id": current["case_id"],
                "arrival": current["arrival"],
                "burst": current["burst"],
                "waiting_time": waiting,
                "turnaround": turnaround,
                "completion_time": finish,
            }
        )
        current_time = finish

    avgs = metrics_averages(metrics)
    return {"timeline": timeline, "metrics": metrics, **avgs}


__all__ = ["sjf_schedule"]

