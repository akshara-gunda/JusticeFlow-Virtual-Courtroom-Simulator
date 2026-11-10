"""Shortest Remaining Time First (preemptive) scheduling algorithm."""

from __future__ import annotations

from typing import Any, Dict, List

from utils.calculations import metrics_averages


def srtf_schedule(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Schedule using unit-time preemption by shortest remaining burst."""
    if not cases:
        return {"timeline": [], "metrics": [], "avg_waiting": 0.0, "avg_turnaround": 0.0}

    ordered = [
        {
            "case_id": str(c["case_id"]),
            "arrival": float(c["arrival"]),
            "burst": float(c["burst"]),
        }
        for c in cases
    ]
    ordered.sort(key=lambda x: (x["arrival"], x["case_id"]))

    remaining = {c["case_id"]: c["burst"] for c in ordered}
    finish: Dict[str, float] = {}

    current_time = min(c["arrival"] for c in ordered)
    completed = 0
    n = len(ordered)
    timeline: List[Dict[str, float | str]] = []

    while completed < n:
        available = [
            c for c in ordered if c["arrival"] <= current_time and remaining[c["case_id"]] > 0
        ]
        if not available:
            current_time = min(
                c["arrival"] for c in ordered if remaining[c["case_id"]] > 0
            )
            continue

        current = min(
            available,
            key=lambda c: (remaining[c["case_id"]], c["arrival"], c["case_id"]),
        )
        cid = current["case_id"]
        start = current_time
        next_arrival = min(
            (c["arrival"] for c in ordered if c["arrival"] > current_time),
            default=float("inf"),
        )
        run_for = min(remaining[cid], next_arrival - current_time)
        end = current_time + run_for

        if timeline and timeline[-1]["case_id"] == cid and timeline[-1]["finish"] == start:
            timeline[-1]["finish"] = end
        else:
            timeline.append({"case_id": cid, "start": start, "finish": end})

        remaining[cid] = max(0.0, remaining[cid] - run_for)
        current_time = end

        if remaining[cid] <= 1e-9:
            finish[cid] = current_time
            remaining[cid] = 0.0
            completed += 1

    metrics = []
    for c in ordered:
        cid = c["case_id"]
        turnaround = finish[cid] - c["arrival"]
        waiting = turnaround - c["burst"]
        metrics.append(
            {
                "case_id": cid,
                "arrival": c["arrival"],
                "burst": c["burst"],
                "waiting_time": waiting,
                "turnaround": turnaround,
                "completion_time": finish[cid],
            }
        )

    avgs = metrics_averages(metrics)
    return {"timeline": timeline, "metrics": metrics, **avgs}


__all__ = ["srtf_schedule"]

