"""LRU page replacement algorithm."""

from __future__ import annotations

from typing import Any, Dict, List


def lru_page_replacement(reference: List[str], frame_count: int = 4) -> Dict[str, Any]:
    """Run LRU page replacement and return step history + total faults."""
    frames = ["-"] * max(1, int(frame_count))
    page_faults = 0
    history = []
    last_used: Dict[str, int] = {}

    for t, page in enumerate([str(p) for p in reference]):
        fault = page not in frames
        fault_indices: List[int] = []

        if fault:
            page_faults += 1
            if "-" in frames:
                idx = frames.index("-")
            else:
                # Replace least-recently-used page.
                idx = min(
                    range(len(frames)),
                    key=lambda i: last_used.get(frames[i], -1),
                )
            frames[idx] = page
            fault_indices = [idx]

        last_used[page] = t
        history.append(
            {
                "page": page,
                "frames": list(frames),
                "fault": fault,
                "fault_indices": fault_indices,
            }
        )

    return {"history": history, "page_faults": page_faults}


__all__ = ["lru_page_replacement"]

