# ⚖️ JusticeFlow – Virtual Courtroom Simulator

JusticeFlow is an interactive web-based project that simulates Operating System concepts using a courtroom analogy. It transforms technical algorithms into an intuitive and visual learning experience.

## Project Overview

This system models CPU scheduling and memory management as courtroom processes. It allows users to input cases, simulate different strategies, and compare their efficiency through visual outputs.

## Features

CPU Scheduling includes FCFS, SJF, SRTF, Round Robin, and Priority Scheduling. The proceedings timeline plays in real time with Play, Pause, Resume, Reset, and 0.5x/1x/2x/4x speed controls. It shows idle periods, the executing case, ready queue, completed cases, simulation time, and per-case completion, turnaround, and waiting metrics.

Memory Management includes FIFO, LRU, and Optimal page replacement. It shows how memory frames are updated step-by-step and tracks page faults.

Comparison mode allows multiple algorithms to be evaluated on the same input and highlights the most efficient strategy.

The interface is fully interactive, allowing users to add and remove cases dynamically and view results instantly.

## Judicial Analogy

In this system, processes are treated as cases, the CPU acts as the judge, scheduling becomes case handling strategy, and memory represents an evidence board. Page faults are treated as missing evidence.

## Tech Stack

Backend is built using Python and Flask.
Frontend uses HTML, CSS, and JavaScript.

## How to Run

From the project folder, install dependencies and start the Flask development server:

```powershell
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in a browser.


## Future Improvements

The project can be extended with audio narration and more advanced visual comparisons.

