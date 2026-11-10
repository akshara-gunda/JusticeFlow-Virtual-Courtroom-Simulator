"""
First-Come, First-Served (FCFS) scheduling algorithm.

This module contains a small, beginner-friendly implementation
of the FCFS strategy using simple Python lists and dictionaries.

Terminology mapping to the courtroom theme:
- Process  -> Case
- CPU      -> Judge
- Execute  -> Hearing
"""

from typing import Any, Dict, List


def fcfs_schedule(cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute an FCFS schedule for the given cases.

    Parameters
    ----------
    cases : list of dict
        Each case dictionary should have the keys:
        - "case_id": a string, e.g. "C1"
        - "arrival": arrival time (int or float)
        - "burst":   burst / duration (int or float)

    Returns
    -------
    result : dict with keys:
        - "timeline": list of segments describing the hearing order.
          Each segment is a dict:
          {
            "case_id": str,
            "start":   number,
            "finish":  number,
          }
        - "metrics": list of per-case metrics in FCFS order:
          {
            "case_id":      str,
            "arrival":      number,
            "burst":        number,
            "waiting_time": number,
            "turnaround":   number,
          }
        - "avg_waiting": average waiting time
        - "avg_turnaround": average turnaround time

    Notes
    -----
    FCFS orders cases by arrival time. If the court is idle because
    the next case has not arrived yet, time jumps to that arrival.
    """
    if not cases:
        return {
            "timeline": [],
            "metrics": [],
            "avg_waiting": 0.0,
            "avg_turnaround": 0.0,
        }

    sorted_cases = sorted(cases, key=lambda c: c["arrival"])

    timeline = []
    metrics = []
    current_time = 0.0

    for case in sorted_cases:
        case_id = str(case["case_id"])
        arrival = float(case["arrival"])
        burst = float(case["burst"])

        if current_time < arrival:
            current_time = arrival

        start = current_time
        finish = current_time + burst

        waiting_time = start - arrival
        turnaround = finish - arrival

        timeline.append({"case_id": case_id, "start": start, "finish": finish})
        metrics.append(
            {
                "case_id": case_id,
                "arrival": arrival,
                "burst": burst,
                "waiting_time": waiting_time,
                "turnaround": turnaround,
                "completion_time": finish,
            }
        )

        current_time = finish

    total_waiting = sum(m["waiting_time"] for m in metrics)
    total_turnaround = sum(m["turnaround"] for m in metrics)
    n = len(metrics)

    return {
        "timeline": timeline,
        "metrics": metrics,
        "avg_waiting": total_waiting / n if n else 0.0,
        "avg_turnaround": total_turnaround / n if n else 0.0,
    }


__all__ = ["fcfs_schedule"]

