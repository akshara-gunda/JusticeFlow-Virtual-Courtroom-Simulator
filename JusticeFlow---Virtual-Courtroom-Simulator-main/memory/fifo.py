"""FIFO page replacement algorithm."""

from __future__ import annotations

from typing import Any, Dict, List


def fifo_page_replacement(reference: List[str], frame_count: int = 4) -> Dict[str, Any]:
    """Run FIFO page replacement and return step history + total page faults."""
    frames = ["-"] * max(1, int(frame_count))
    pointer = 0
    page_faults = 0
    history = []

    for page in [str(p) for p in reference]:
        fault = page not in frames
        fault_indices: List[int] = []

        if fault:
            frames[pointer] = page
            fault_indices = [pointer]
            pointer = (pointer + 1) % len(frames)
            page_faults += 1

        history.append(
            {
                "page": page,
                "frames": list(frames),
                "fault": fault,
                "fault_indices": fault_indices,
            }
        )

    return {"history": history, "page_faults": page_faults}


__all__ = ["fifo_page_replacement"]

