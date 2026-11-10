"""Round Robin scheduling algorithm."""

from __future__ import annotations

from collections import deque
from typing import Any, Dict, List

from utils.calculations import metrics_averages


def round_robin_schedule(cases: List[Dict[str, Any]], quantum: float = 2.0) -> Dict[str, Any]:
    """Schedule cases with Round Robin and return timeline + metrics."""
    if not cases:
        return {"timeline": [], "metrics": [], "avg_waiting": 0.0, "avg_turnaround": 0.0}

    quantum = max(float(quantum), 0.1)
    ordered = sorted(cases, key=lambda c: (float(c["arrival"]), str(c["case_id"])))
    n = len(ordered)

    remaining = {str(c["case_id"]): float(c["burst"]) for c in ordered}
    arrival = {str(c["case_id"]): float(c["arrival"]) for c in ordered}
    burst = {str(c["case_id"]): float(c["burst"]) for c in ordered}
    finish: Dict[str, float] = {}

    timeline: List[Dict[str, float | str]] = []
    ready = deque()
    i = 0
    current_time = min(float(c["arrival"]) for c in ordered)

    while i < n and float(ordered[i]["arrival"]) <= current_time:
        ready.append(str(ordered[i]["case_id"]))
        i += 1

    while ready or i < n:
        if not ready:
            current_time = float(ordered[i]["arrival"])
            while i < n and float(ordered[i]["arrival"]) <= current_time:
                ready.append(str(ordered[i]["case_id"]))
                i += 1

        case_id = ready.popleft()
        run_for = min(quantum, remaining[case_id])
        start = current_time
        end = current_time + run_for

        timeline.append({"case_id": case_id, "start": start, "finish": end})
        remaining[case_id] -= run_for
        current_time = end

        while i < n and float(ordered[i]["arrival"]) <= current_time:
            ready.append(str(ordered[i]["case_id"]))
            i += 1

        if remaining[case_id] > 0:
            ready.append(case_id)
        else:
            finish[case_id] = current_time

    metrics = []
    for c in ordered:
        cid = str(c["case_id"])
        turnaround = float(finish[cid]) - arrival[cid]
        waiting = turnaround - burst[cid]
        metrics.append(
            {
                "case_id": cid,
                "arrival": arrival[cid],
                "burst": burst[cid],
                "waiting_time": waiting,
                "turnaround": turnaround,
                "completion_time": finish[cid],
            }
        )

    avgs = metrics_averages(metrics)
    return {"timeline": timeline, "metrics": metrics, **avgs}


__all__ = ["round_robin_schedule"]

