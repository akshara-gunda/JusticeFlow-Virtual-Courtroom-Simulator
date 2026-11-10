"""Optimal page replacement algorithm."""

from __future__ import annotations

from typing import Any, Dict, List


def optimal_page_replacement(reference: List[str], frame_count: int = 4) -> Dict[str, Any]:
    """Run Optimal page replacement and return step history + total faults."""
    refs = [str(p) for p in reference]
    frames = ["-"] * max(1, int(frame_count))
    page_faults = 0
    history = []

    for i, page in enumerate(refs):
        fault = page not in frames
        fault_indices: List[int] = []

        if fault:
            page_faults += 1
            if "-" in frames:
                idx = frames.index("-")
            else:
                # Replace page used farthest in the future (or never used again).
                future_distances = []
                for frame_page in frames:
                    try:
                        nxt = refs[i + 1 :].index(frame_page)
                        dist = nxt + 1
                    except ValueError:
                        dist = float("inf")
                    future_distances.append(dist)
                idx = future_distances.index(max(future_distances))

            frames[idx] = page
            fault_indices = [idx]

        history.append(
            {
                "page": page,
                "frames": list(frames),
                "fault": fault,
                "fault_indices": fault_indices,
            }
        )

    return {"history": history, "page_faults": page_faults}


__all__ = ["optimal_page_replacement"]

