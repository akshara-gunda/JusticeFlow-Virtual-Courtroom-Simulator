from __future__ import annotations

import math
from typing import Any, Dict, List

from flask import Flask, jsonify, render_template, request

from memory.fifo import fifo_page_replacement
from memory.lru import lru_page_replacement
from memory.optimal import optimal_page_replacement
from scheduler.fcfs import fcfs_schedule
from scheduler.priority import priority_schedule
from scheduler.round_robin import round_robin_schedule
from scheduler.sjf import sjf_schedule
from scheduler.srtf import srtf_schedule

app = Flask(__name__)


def _parse_cases(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Normalize case payload for scheduling algorithms."""
    cases = payload.get("cases", [])
    normalized = []
    for c in cases:
        case_id = str(c.get("case_id", "")).strip()
        if not case_id:
            continue
        arrival = float(c.get("arrival", c.get("arrival_time", 0)))
        burst = float(c.get("burst", c.get("duration", 0)))
        priority = int(c.get("priority", 0))
        if burst <= 0:
            continue
        normalized.append(
            {
                "case_id": case_id,
                "arrival": arrival,
                "burst": burst,
                "priority": priority,
            }
        )
    return normalized


def _parse_memory_request(payload: Dict[str, Any]) -> tuple[List[str], int]:
    """Validate page references and frame count for memory simulations."""
    raw_reference = payload.get("reference", [])
    if isinstance(raw_reference, str):
        if not raw_reference.strip():
            raise ValueError("Enter a comma-separated page reference string.")
        pages = [page.strip() for page in raw_reference.split(",")]
        if any(not page for page in pages):
            raise ValueError("Each page reference must contain a value separated by commas.")
    elif isinstance(raw_reference, list):
        if not raw_reference or any(page is None for page in raw_reference):
            raise ValueError("Enter at least one valid page reference.")
        pages = [str(page).strip() for page in raw_reference]
        if any(not page for page in pages):
            raise ValueError("Each page reference must contain a value.")
    else:
        raise ValueError("Page references must be a comma-separated string or a list.")

    if any(page == "-" for page in pages):
        raise ValueError("The dash character is reserved for an empty frame.")

    raw_frame_count = payload.get("frame_count", 3)
    if isinstance(raw_frame_count, bool):
        raise ValueError("Frame count must be a whole number from 1 to 32.")
    try:
        numeric_frame_count = float(raw_frame_count)
    except (TypeError, ValueError):
        raise ValueError("Frame count must be a whole number from 1 to 32.") from None

    if not math.isfinite(numeric_frame_count) or not numeric_frame_count.is_integer():
        raise ValueError("Frame count must be a whole number from 1 to 32.")

    frame_count = int(numeric_frame_count)
    if not 1 <= frame_count <= 32:
        raise ValueError("Frame count must be between 1 and 32.")

    return pages, frame_count


def _run_memory_algorithm(payload: Dict[str, Any], algorithm):
    try:
        reference, frame_count = _parse_memory_request(payload)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    return jsonify(algorithm(reference, frame_count=frame_count))


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/fcfs")
def route_fcfs():
    payload = request.get_json(silent=True) or {}
    result = fcfs_schedule(_parse_cases(payload))
    return jsonify(result)


@app.post("/sjf")
def route_sjf():
    payload = request.get_json(silent=True) or {}
    result = sjf_schedule(_parse_cases(payload))
    return jsonify(result)


@app.post("/srtf")
def route_srtf():
    payload = request.get_json(silent=True) or {}
    result = srtf_schedule(_parse_cases(payload))
    return jsonify(result)


@app.post("/rr")
def route_rr():
    payload = request.get_json(silent=True) or {}
    quantum = float(payload.get("quantum", 2))
    result = round_robin_schedule(_parse_cases(payload), quantum=quantum)
    return jsonify(result)


@app.post("/priority")
def route_priority():
    payload = request.get_json(silent=True) or {}
    result = priority_schedule(_parse_cases(payload))
    return jsonify(result)


@app.post("/fifo")
def route_fifo():
    payload = request.get_json(silent=True) or {}
    return _run_memory_algorithm(payload, fifo_page_replacement)


@app.post("/lru")
def route_lru():
    payload = request.get_json(silent=True) or {}
    return _run_memory_algorithm(payload, lru_page_replacement)


@app.post("/optimal")
def route_optimal():
    payload = request.get_json(silent=True) or {}
    return _run_memory_algorithm(payload, optimal_page_replacement)


@app.post("/compare_memory")
def route_compare_memory():
    payload = request.get_json(silent=True) or {}
    try:
        reference, frame_count = _parse_memory_request(payload)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    fifo_result = fifo_page_replacement(reference, frame_count=frame_count)
    lru_result = lru_page_replacement(reference, frame_count=frame_count)
    optimal_result = optimal_page_replacement(reference, frame_count=frame_count)

    return jsonify(
        {
            "fifo": fifo_result,
            "lru": lru_result,
            "optimal": optimal_result,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
