const caseList = [
  { case_id: "C1", arrival: 0, burst: 5, priority: 2 },
  { case_id: "C2", arrival: 1, burst: 3, priority: 1 },
  { case_id: "C3", arrival: 2, burst: 8, priority: 3 }
];

const state = {
  activeView: "gantt",
  scheduleResult: null,
  memoryResult: null,
  comparisonResult: [],
  activeScheduleCase: null,
  activeMemoryStep: null,
  memoryComparisonResult: null,
  memoryRequestId: 0,
  memoryComparisonRequestId: 0,
  memory: {
    history: [],
    algorithm: "",
    reference: [],
    frameCount: 0,
    stepIndex: -1,
    hits: 0,
    faults: 0,
    playing: false,
    timerId: null,
    speed: 1,
    frameNodes: [],
    historyCells: [],
    status: "idle"
  },
  renderToken: 0,
  scheduleCases: [],
  simulation: {
    segments: [],
    metrics: [],
    nodes: [],
    cursor: null,
    time: 0,
    total: 0,
    speed: 1,
    playing: false,
    lastFrame: null,
    frameId: null,
    status: "idle",
    scroller: null,
    autoScrollTarget: -1
  }
};

const caseColorHues = new Map();
const caseColors = new Map();
const caseColorPresets = {
  C1: { hue: 44, color: "#e8be58" },
  C2: { hue: 172, color: "#55d1c1" },
  C3: { hue: 8, color: "#f17d70" },
  C4: { hue: 270, color: "#b89be8" },
  C5: { hue: 213, color: "#75a9e8" }
};

const comparisonConfigs = [
  { key: "fcfs", label: "FCFS" },
  { key: "sjf", label: "SJF" },
  { key: "rr", label: "Round Robin" },
  { key: "priority", label: "Priority" }
];

const caseTableBody = document.querySelector("#case-table tbody");
const outputBox = document.getElementById("output-box");
const ganttChart = document.getElementById("ganttChart");
const memoryGrid = document.getElementById("memoryGrid");
const memoryHistoryGraph = document.getElementById("memory-history-graph");
const memoryEventLog = document.getElementById("memory-event-log");
const memoryInputError = document.getElementById("memory-input-error");
const referenceInput = document.getElementById("reference-input");
const frameCountInput = document.getElementById("frame-count");
const comparisonGrid = document.getElementById("comparisonGrid");
const metricsPanel = document.getElementById("metricsPanel");
const memoryComparisonPanel = document.getElementById("memory-comparison-panel");
const scheduleSelect = document.getElementById("schedule-algo");
const memorySelect = document.getElementById("memory-algo");
const scheduleSelectionPill = document.getElementById("schedule-selection-pill");
const memorySelectionPill = document.getElementById("memory-selection-pill");
const startHearingButton = document.getElementById("start-hearing-btn");
const runMemoryButton = document.getElementById("run-memory-btn");
const compareMemoryButton = document.getElementById("compare-memory-btn");
const memoryPlayButton = document.getElementById("memory-play");
const memoryPauseButton = document.getElementById("memory-pause");
const memoryResumeButton = document.getElementById("memory-resume");
const memoryResetButton = document.getElementById("memory-reset");
const memoryNextStepButton = document.getElementById("memory-next-step");
const memorySpeedSelect = document.getElementById("memory-speed");
const memoryPlaybackStatus = document.getElementById("memory-playback-status");
const memoryStepCount = document.getElementById("memory-step-count");
const memoryCurrentPage = document.getElementById("memory-current-page");
const memoryPageHits = document.getElementById("memory-page-hits");
const memoryPageFaults = document.getElementById("memory-page-faults");
const memoryFaultRate = document.getElementById("memory-fault-rate");
const memoryRemaining = document.getElementById("memory-remaining");
const runComparisonButton = document.getElementById("run-comparison-btn");
const judgeOrb = document.getElementById("judge-orb");
const simulationPlayButton = document.getElementById("simulation-play");
const simulationPauseButton = document.getElementById("simulation-pause");
const simulationResumeButton = document.getElementById("simulation-resume");
const simulationResetButton = document.getElementById("simulation-reset");
const simulationSpeedSelect = document.getElementById("simulation-speed");
const simulationTime = document.getElementById("simulation-time");
const simulationCurrent = document.getElementById("simulation-current");
const simulationCurrentName = document.getElementById("simulation-current-name");
const simulationStatus = document.getElementById("simulation-status");
const simulationReady = document.getElementById("simulation-ready");
const simulationCompleted = document.getElementById("simulation-completed");
const caseMetrics = document.getElementById("case-metrics");
const judgeStatusTitle = document.getElementById("judge-status-title");
const judgeStatusText = document.getElementById("judge-status-text");
const viewTabs = Array.from(document.querySelectorAll(".view-tab"));
const viewPanels = Array.from(document.querySelectorAll("[data-view-panel]"));

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextRenderToken() {
  state.renderToken += 1;
  return state.renderToken;
}

function isTokenActive(token) {
  return token === state.renderToken;
}

function getCaseColor(caseId) {
  const id = String(caseId);
  if (caseColors.has(id)) {
    return caseColors.get(id);
  }

  const preset = caseColorPresets[id];
  let hue = preset?.hue;
  let color = preset?.color;

  if (typeof hue !== "number") {
    let hash = 0;
    for (const character of id) {
      hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }
    hue = hash % 360;
    const reservedHues = new Set([
      ...caseColorHues.values(),
      ...Object.values(caseColorPresets).map((entry) => entry.hue)
    ]);
    while (reservedHues.has(hue)) {
      hue = (hue + 137.508) % 360;
    }
    color = `hsl(${hue} 68% 72%)`;
  }

  caseColorHues.set(id, hue);
  caseColors.set(id, color);
  return color;
}

function renderCases() {
  caseTableBody.innerHTML = "";

  caseList.forEach((c, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.case_id}</td>
      <td>${c.arrival}</td>
      <td>${c.burst}</td>
      <td>${c.priority}</td>
      <td class="action-cell"><button class="delete-btn" type="button" onclick="deleteCase(${index})" title="Remove Case" aria-label="Remove Case">-</button></td>
    `;
    const caseIdCell = tr.cells[0];
    const swatch = document.createElement("span");
    caseIdCell.className = "case-register-id";
    caseIdCell.style.setProperty("--case-color", getCaseColor(c.case_id));
    swatch.className = "case-color-dot";
    swatch.setAttribute("aria-hidden", "true");
    caseIdCell.textContent = "";
    caseIdCell.append(swatch, document.createTextNode(c.case_id));
    caseTableBody.appendChild(tr);
  });
}

function deleteCase(index) {
  const selectedCase = caseList[index];

  if (!selectedCase) {
    return;
  }

  const confirmed = window.confirm(`Are you sure you want to remove case ${selectedCase.case_id}?`);

  if (!confirmed) {
    return;
  }

  caseList.splice(index, 1);
  renderCases();
  setMetrics([
    { label: "Removed Case", value: selectedCase.case_id },
    { label: "Total Cases", value: String(caseList.length) }
  ]);
  setMessage([`Case ${selectedCase.case_id} has been removed from the courtroom docket.`]);
  updateJudgeStatus("Docket updated", `Case ${selectedCase.case_id} has been removed from the register.`);
}

function setMessage(lines) {
  outputBox.innerHTML = "";

  lines.forEach((line) => {
    const row = document.createElement("div");
    row.className = "output-line";
    row.textContent = line;
    outputBox.appendChild(row);
  });
}

function setMetrics(cards) {
  metricsPanel.innerHTML = "";

  cards.forEach((card) => {
    const article = document.createElement("article");
    const label = document.createElement("span");
    const value = document.createElement("strong");

    article.className = "metric-card";
    label.className = "metric-label";
    value.className = "metric-value";

    label.textContent = card.label;
    value.textContent = card.value;

    article.appendChild(label);
    article.appendChild(value);
    metricsPanel.appendChild(article);
  });
}

function showNotice(container, text) {
  container.innerHTML = "";

  const note = document.createElement("div");
  note.className = "notice-box";
  note.textContent = text;
  container.appendChild(note);
}

function showMemoryComparisonNotice(text) {
  memoryComparisonPanel.innerHTML = "";

  const note = document.createElement("div");
  note.className = "notice-box";
  note.style.minHeight = "80px";
  note.textContent = text;
  memoryComparisonPanel.appendChild(note);
}

function getMemoryReferenceSequence() {
  return referenceInput.value.split(",").map((item) => item.trim());
}

function getMemorySimulationInput() {
  const reference = getMemoryReferenceSequence();
  const frameCount = Number(frameCountInput.value);

  if (!referenceInput.value.trim()) {
    return { error: "Enter a page reference string, such as 7, 0, 1, 2." };
  }
  if (reference.some((page) => !page)) {
    return { error: "Remove empty entries from the page reference string." };
  }
  if (reference.some((page) => page === "-")) {
    return { error: "The dash character is reserved for an empty memory frame." };
  }
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > 32) {
    return { error: "Frame count must be a whole number from 1 to 32." };
  }

  return { reference, frameCount };
}

function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function updateJudgeStatus(title, text, busy = false) {
  judgeStatusTitle.textContent = title;
  judgeStatusText.textContent = text;
  judgeOrb.classList.toggle("is-active", busy);
  judgeOrb.classList.toggle("is-busy", busy);
}

function setLoadingState(button, container, isLoading) {
  button.classList.toggle("is-loading", isLoading);
  container.classList.toggle("is-busy", isLoading);
}

function updateSelectionPills() {
  scheduleSelectionPill.textContent = `Active Strategy: ${scheduleSelect.options[scheduleSelect.selectedIndex].text}`;
  memorySelectionPill.textContent = `Active Memory Rule: ${memorySelect.options[memorySelect.selectedIndex].text}`;
  scheduleSelect.classList.add("is-active");
  memorySelect.classList.add("is-active");
}

function setActiveView(view) {
  state.activeView = view;

  viewTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  });

  viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
  });
}

function clearVisuals() {
  if (state.simulation.playing) {
    pauseSimulation();
  }
  if (state.memory.playing) {
    pauseMemoryPlayback();
  }
  ganttChart.innerHTML = "";
  memoryGrid.innerHTML = "";
  comparisonGrid.innerHTML = "";
}

function createMiniGantt(timeline) {
  const lane = document.createElement("div");
  lane.className = "comparison-mini-gantt";

  timeline.forEach((item) => {
    const duration = Math.max(0, Number(item.finish) - Number(item.start));
    const block = document.createElement("div");

    block.className = "comparison-mini-block";
    block.textContent = item.case_id;
    block.style.setProperty("--case-color", getCaseColor(item.case_id));
    block.style.width = `${Math.max(duration * 18, 34)}px`;
    block.title = `${item.case_id}: ${item.start} to ${item.finish}`;
    lane.appendChild(block);
  });

  return lane;
}

function buildTimelineWithIdle(timeline) {
  const segments = [];
  let cursor = 0;

  timeline.map((item) => ({
    case_id: String(item.case_id),
    start: Number(item.start),
    finish: Number(item.finish)
  })).sort((left, right) => left.start - right.start).forEach((item) => {
    if (item.start > cursor) {
      segments.push({ case_id: "Idle", start: cursor, finish: item.start, idle: true });
    }
    segments.push({ ...item, idle: false });
    cursor = item.finish;
  });

  return segments;
}

function renderCaseChips(container, caseIds) {
  const signature = JSON.stringify(caseIds);
  if (container.dataset.caseSignature === signature) {
    return;
  }

  container.dataset.caseSignature = signature;
  if (!caseIds.length) {
    const empty = document.createElement("span");
    empty.className = "queue-empty";
    empty.textContent = "-";
    container.replaceChildren(empty);
    return;
  }

  const existing = new Map(Array.from(container.children)
    .filter((chip) => chip.dataset.caseId)
    .map((chip) => [chip.dataset.caseId, chip]));
  const chips = caseIds.map((caseId) => {
    const chip = existing.get(caseId) || document.createElement("span");
    if (!existing.has(caseId)) {
      chip.className = "case-chip";
      chip.dataset.caseId = caseId;
      chip.style.setProperty("--case-color", getCaseColor(caseId));
      chip.textContent = caseId;
    }
    return chip;
  });
  container.replaceChildren(...chips);
}

function updateSimulationStatus() {
  const labels = {
    idle: "Awaiting schedule",
    ready: "Ready to play",
    running: "In progress",
    paused: "Paused",
    complete: "Complete"
  };
  simulationStatus.dataset.state = state.simulation.status;
  simulationStatus.textContent = labels[state.simulation.status] || "Awaiting schedule";
}

function getSimulationScrollBehavior() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function updateSimulationButtons() {
  const simulation = state.simulation;
  const ready = simulation.segments.length > 0;
  const complete = simulation.time >= simulation.total;

  simulationPlayButton.disabled = !ready || simulation.playing;
  simulationPauseButton.disabled = !simulation.playing;
  simulationResumeButton.disabled = !ready || simulation.playing || complete;
  simulationResetButton.disabled = !ready || (!simulation.playing && simulation.time === 0 && simulation.status === "ready");
  simulationSpeedSelect.disabled = !ready;
  simulationPauseButton.classList.toggle("is-active-control", simulation.playing);
  simulationResumeButton.classList.toggle("is-active-control", simulation.status === "paused");
  simulationPauseButton.setAttribute("aria-pressed", String(simulation.playing));
  simulationResumeButton.setAttribute("aria-pressed", String(simulation.status === "paused"));
}

function updateSimulationReadout() {
  const simulation = state.simulation;
  const currentSegment = simulation.segments.find((segment) =>
    !segment.idle && simulation.time >= segment.start && simulation.time < segment.finish
  );
  const activeCase = currentSegment?.case_id || null;
  const completedCases = simulation.metrics
    .filter((metric) => Number(metric.completion_time) <= simulation.time + 1e-9)
    .map((metric) => metric.case_id);
  const readyCases = state.scheduleCases.filter((item) => {
    const metric = simulation.metrics.find((result) => result.case_id === item.case_id);
    return Number(item.arrival) <= simulation.time
      && Number(metric?.completion_time) > simulation.time + 1e-9
      && item.case_id !== activeCase;
  }).sort((left, right) => {
    const leftNext = simulation.segments.find((segment) =>
      segment.case_id === left.case_id && segment.finish > simulation.time
    )?.start ?? Number.POSITIVE_INFINITY;
    const rightNext = simulation.segments.find((segment) =>
      segment.case_id === right.case_id && segment.finish > simulation.time
    )?.start ?? Number.POSITIVE_INFINITY;
    return leftNext - rightNext;
  }).map((item) => item.case_id);

  simulationTime.textContent = formatNumber(simulation.time);
  simulationCurrentName.textContent = activeCase || "Idle";
  simulationCurrent.classList.toggle("is-executing", Boolean(activeCase));
  if (activeCase) {
    simulationCurrent.style.setProperty("--case-color", getCaseColor(activeCase));
  } else {
    simulationCurrent.style.removeProperty("--case-color");
  }
  if (activeCase !== state.activeScheduleCase) {
    simulationCurrent.classList.remove("is-switching");
    requestAnimationFrame(() => simulationCurrent.classList.add("is-switching"));
    setTimeout(() => simulationCurrent.classList.remove("is-switching"), 360);
  }
  renderCaseChips(simulationReady, readyCases);
  renderCaseChips(simulationCompleted, completedCases);
  state.activeScheduleCase = activeCase;

  simulation.nodes.forEach(({ segment, block }) => {
    const duration = segment.finish - segment.start;
    const progress = duration > 0 ? Math.max(0, Math.min(1, (simulation.time - segment.start) / duration)) : 0;
    block.style.clipPath = `inset(0 ${100 - progress * 100}% 0 0)`;
    block.classList.toggle("is-current", segment === currentSegment);
  });

  if (simulation.cursor) {
    const progress = simulation.total > 0 ? Math.min(simulation.time / simulation.total, 1) : 0;
    simulation.cursor.style.left = `${progress * 100}%`;
    if (simulation.playing && simulation.scroller) {
      const cursorX = simulation.cursor.offsetLeft + simulation.cursor.offsetWidth / 2;
      const scrollRight = simulation.scroller.scrollLeft + simulation.scroller.clientWidth - 72;
      const target = Math.max(0, cursorX - simulation.scroller.clientWidth * 0.68);
      if (cursorX > scrollRight && target > simulation.autoScrollTarget + simulation.scroller.clientWidth * 0.22) {
        simulation.scroller.scrollTo({ left: target, behavior: getSimulationScrollBehavior() });
        simulation.autoScrollTarget = target;
      }
    }
  }
  updateSimulationStatus();
  updateSimulationButtons();
}

function renderGanttChart(timeline, metrics, initialTime = 0) {
  ganttChart.innerHTML = "";
  if (!Array.isArray(timeline) || timeline.length === 0) {
    state.simulation = {
      ...state.simulation,
      segments: [],
      metrics: [],
      nodes: [],
      cursor: null,
      scroller: null,
      time: 0,
      total: 0,
      playing: false,
      status: "idle",
      frameId: null,
      lastFrame: null
    };
    state.activeScheduleCase = null;
    showNotice(ganttChart, "No hearing timeline available.");
    updateSimulationReadout();
    updateSimulationButtons();
    updateJudgeStatus("Court is awaiting session", "No proceedings are currently queued.");
    return;
  }

  const segments = buildTimelineWithIdle(timeline);
  const total = segments[segments.length - 1].finish;
  const chartWidth = Math.max(680, total * 88);
  const scroll = document.createElement("div");
  const ruler = document.createElement("div");
  const track = document.createElement("div");
  const cursor = document.createElement("div");
  scroll.className = "gantt-scroll";
  ruler.className = "gantt-ruler";
  track.className = "gantt-track";
  cursor.className = "gantt-cursor";
  [scroll, ruler, track].forEach((element) => {
    element.style.width = `${chartWidth}px`;
  });

  const boundaries = new Set([0, total]);
  segments.forEach((segment) => {
    boundaries.add(segment.start);
    boundaries.add(segment.finish);
  });
  [...boundaries].sort((left, right) => left - right).forEach((time) => {
    const tick = document.createElement("span");
    tick.className = "gantt-tick";
    tick.textContent = formatNumber(time);
    tick.style.left = `${(time / total) * 100}%`;
    ruler.appendChild(tick);
  });

  const nodes = segments.map((segment) => {
    const block = document.createElement("div");
    const label = document.createElement("strong");
    const time = document.createElement("span");
    block.className = segment.idle ? "gantt-block is-idle" : "gantt-block";
    if (!segment.idle) {
      block.style.setProperty("--case-color", getCaseColor(segment.case_id));
    }
    block.style.left = `${(segment.start / total) * 100}%`;
    block.style.width = `${((segment.finish - segment.start) / total) * 100}%`;
    block.style.clipPath = "inset(0 100% 0 0)";
    label.textContent = segment.idle ? "CPU Idle" : segment.case_id;
    time.textContent = `${formatNumber(segment.start)} - ${formatNumber(segment.finish)}`;
    block.title = `${label.textContent}: ${time.textContent}`;
    block.append(label, time);
    track.appendChild(block);
    return { segment, block };
  });

  track.appendChild(cursor);
  scroll.append(ruler, track);
  ganttChart.appendChild(scroll);
  state.simulation = {
    ...state.simulation,
    segments,
    metrics: Array.isArray(metrics) ? metrics : [],
    nodes,
    cursor,
    scroller: scroll,
    time: Math.max(0, Math.min(initialTime, total)),
    total,
    playing: false,
    status: initialTime >= total ? "complete" : initialTime > 0 ? "paused" : "ready",
    autoScrollTarget: -1,
    lastFrame: null,
    frameId: null
  };
  updateSimulationReadout();
  updateJudgeStatus("Schedule ready", "Play the simulation to follow the CPU timeline and live queue.");
}

function advanceSimulation(timestamp) {
  const simulation = state.simulation;
  if (!simulation.playing) {
    return;
  }

  if (simulation.lastFrame !== null) {
    simulation.time += ((timestamp - simulation.lastFrame) / 1000) * simulation.speed;
  }
  simulation.lastFrame = timestamp;
  if (simulation.time >= simulation.total) {
    simulation.time = simulation.total;
    simulation.playing = false;
    simulation.status = "complete";
  }

  updateSimulationReadout();
  if (simulation.playing) {
    simulation.frameId = requestAnimationFrame(advanceSimulation);
  } else {
    simulation.lastFrame = null;
    updateJudgeStatus("Proceedings complete", "All queued cases have now been heard by the court.");
  }
}

function startSimulation() {
  const simulation = state.simulation;
  if (!simulation.segments.length) {
    return;
  }
  simulation.time = 0;
  simulation.playing = true;
  simulation.status = "running";
  simulation.autoScrollTarget = -1;
  if (simulation.scroller) {
    simulation.scroller.scrollTo({ left: 0, behavior: getSimulationScrollBehavior() });
  }
  simulation.lastFrame = null;
  updateSimulationReadout();
  updateJudgeStatus("Court is in session", "The bench is following the scheduled case flow.", true);
  simulation.frameId = requestAnimationFrame(advanceSimulation);
}

function pauseSimulation() {
  const simulation = state.simulation;
  simulation.playing = false;
  simulation.status = "paused";
  simulation.lastFrame = null;
  if (simulation.frameId !== null) {
    cancelAnimationFrame(simulation.frameId);
    simulation.frameId = null;
  }
  updateSimulationButtons();
  updateJudgeStatus("Proceedings paused", `Simulation paused at time ${formatNumber(simulation.time)}.`);
}

function resumeSimulation() {
  const simulation = state.simulation;
  if (!simulation.segments.length || simulation.time >= simulation.total) {
    return;
  }
  simulation.playing = true;
  simulation.status = "running";
  simulation.lastFrame = null;
  updateSimulationButtons();
  updateJudgeStatus("Court is in session", "Proceedings have resumed from the paused time.", true);
  simulation.frameId = requestAnimationFrame(advanceSimulation);
}

function resetSimulation() {
  const simulation = state.simulation;
  simulation.playing = false;
  simulation.status = "ready";
  simulation.time = 0;
  simulation.autoScrollTarget = -1;
  if (simulation.scroller) {
    simulation.scroller.scrollTo({ left: 0, behavior: getSimulationScrollBehavior() });
  }
  simulation.lastFrame = null;
  if (simulation.frameId !== null) {
    cancelAnimationFrame(simulation.frameId);
    simulation.frameId = null;
  }
  updateSimulationReadout();
  updateJudgeStatus("Schedule ready", "The simulation has been reset to time zero.");
}

function renderCaseMetrics(metrics) {
  caseMetrics.innerHTML = "";
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return;
  }

  const table = document.createElement("table");
  table.className = "case-metrics-table";
  table.innerHTML = "<thead><tr><th>Case</th><th>Arrival</th><th>Burst</th><th>Completion</th><th>Turnaround</th><th>Waiting</th></tr></thead><tbody></tbody>";
  const body = table.querySelector("tbody");
  metrics.forEach((metric) => {
    const row = document.createElement("tr");
    [metric.case_id, metric.arrival, metric.burst, metric.completion_time, metric.turnaround, metric.waiting_time]
      .forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = typeof value === "number" ? formatNumber(value) : String(value ?? "-");
        row.appendChild(cell);
      });
    body.appendChild(row);
  });
  caseMetrics.appendChild(table);
}

function getMemoryStepMessage(history, stepIndex, algorithm) {
  const step = history[stepIndex];
  const faultIndices = Array.isArray(step.fault_indices) ? step.fault_indices : [];

  if (!step.fault) {
    const frameIndex = step.frames.indexOf(step.page);
    return `Step ${stepIndex + 1}: Page ${step.page} is already in frame ${frameIndex + 1}. Page hit.`;
  }

  const frameIndex = faultIndices[0];
  const previousFrames = stepIndex > 0 ? history[stepIndex - 1].frames : Array(state.memory.frameCount).fill("-");
  const evictedPage = previousFrames[frameIndex];
  if (evictedPage === "-") {
    return `Step ${stepIndex + 1}: Page ${step.page} loaded into empty frame ${frameIndex + 1}. Page fault.`;
  }
  return `Step ${stepIndex + 1}: Page ${step.page} replaces page ${evictedPage} using ${algorithm.toUpperCase()} in frame ${frameIndex + 1}. Page fault.`;
}

function appendMemoryLogEntry(stepIndex) {
  const step = state.memory.history[stepIndex];
  const entry = document.createElement("p");
  memoryEventLog.querySelector(".memory-log-empty")?.remove();
  entry.className = step.fault ? "memory-log-entry is-fault" : "memory-log-entry is-hit";
  entry.textContent = getMemoryStepMessage(state.memory.history, stepIndex, state.memory.algorithm);
  memoryEventLog.querySelectorAll(".is-latest").forEach((item) => item.classList.remove("is-latest"));
  entry.classList.add("is-latest");
  memoryEventLog.appendChild(entry);
  memoryEventLog.scrollTop = memoryEventLog.scrollHeight;
}

function updateMemoryPlaybackStatus() {
  const labels = {
    idle: "Awaiting simulation",
    loading: "Preparing frames",
    ready: "Ready to play",
    running: "In progress",
    paused: "Paused",
    complete: "Complete"
  };
  memoryPlaybackStatus.dataset.state = state.memory.status;
  memoryPlaybackStatus.textContent = labels[state.memory.status] || labels.idle;
}

function updateMemoryControls() {
  const memory = state.memory;
  const hasHistory = memory.history.length > 0;
  const complete = memory.stepIndex >= memory.history.length - 1;

  memoryPlayButton.disabled = !hasHistory || memory.playing || (memory.stepIndex > -1 && memory.status !== "complete");
  memoryPauseButton.disabled = !memory.playing;
  memoryResumeButton.disabled = !hasHistory || memory.playing || complete || memory.stepIndex < 0 || memory.status !== "paused";
  memoryResetButton.disabled = !hasHistory;
  memoryNextStepButton.disabled = !hasHistory || complete || memory.playing;
  memorySpeedSelect.disabled = !hasHistory;
  memoryPauseButton.classList.toggle("is-active-control", memory.playing);
  memoryResumeButton.classList.toggle("is-active-control", memory.status === "paused");
  memoryPauseButton.setAttribute("aria-pressed", String(memory.playing));
  memoryResumeButton.setAttribute("aria-pressed", String(memory.status === "paused"));
  updateMemoryPlaybackStatus();
}

function updateMemoryReadout() {
  const memory = state.memory;
  const processed = Math.max(0, memory.stepIndex + 1);
  memory.hits = memory.history.slice(0, processed).filter((step) => !step.fault).length;
  memory.faults = memory.history.slice(0, processed).filter((step) => step.fault).length;
  const currentStep = memory.stepIndex >= 0 ? memory.history[memory.stepIndex] : null;

  memoryStepCount.textContent = `${processed} / ${memory.history.length}`;
  memoryCurrentPage.textContent = currentStep ? currentStep.page : "-";
  memoryPageHits.textContent = String(memory.hits);
  memoryPageFaults.textContent = String(memory.faults);
  memoryFaultRate.textContent = `${processed ? formatNumber((memory.faults / processed) * 100) : "0"}%`;
  memoryRemaining.textContent = String(memory.history.length - processed);
  updateMemoryControls();
}

function renderMemoryStep(appendLog = true) {
  const memory = state.memory;
  const step = memory.stepIndex >= 0 ? memory.history[memory.stepIndex] : null;
  const previousFrames = memory.stepIndex > 0
    ? memory.history[memory.stepIndex - 1].frames
    : Array(memory.frameCount).fill("-");
  const frameValues = step ? step.frames : Array(memory.frameCount).fill("-");
  const faultIndices = step && step.fault && Array.isArray(step.fault_indices) ? step.fault_indices : [];
  const targetFrame = step
    ? step.fault ? faultIndices[0] : step.frames.indexOf(step.page)
    : -1;

  memory.frameNodes.forEach((frame, frameIndex) => {
    const pageNode = frame.querySelector(".memory-frame-page");
    const oldPage = previousFrames[frameIndex];
    const page = frameValues[frameIndex] ?? "-";
    frame.classList.remove("is-empty", "is-hit", "is-fault");
    pageNode.className = "memory-frame-page";
    frame.querySelector(".memory-evicted-page")?.remove();
    pageNode.textContent = page === "-" ? "Empty" : page;

    if (page === "-") {
      frame.classList.add("is-empty");
    } else if (step && step.fault && frameIndex === targetFrame) {
      frame.classList.add("is-fault");
      pageNode.classList.add("is-incoming");
      if (oldPage && oldPage !== "-") {
        const evicted = document.createElement("span");
        evicted.className = "memory-evicted-page";
        evicted.textContent = `-${oldPage}`;
        frame.querySelector(".memory-frame-stage").appendChild(evicted);
      }
    } else if (step && !step.fault && frameIndex === targetFrame) {
      frame.classList.add("is-hit");
      pageNode.classList.add("is-hit");
    }

    frame.title = page === "-"
      ? `Frame ${frameIndex + 1} is empty`
      : `Frame ${frameIndex + 1}: page ${page}`;
  });

  memory.historyCells.forEach((cells, index) => {
    cells.forEach((cell) => cell.classList.toggle("is-current", index === memory.stepIndex));
  });

  if (step) {
    if (appendLog) {
      appendMemoryLogEntry(memory.stepIndex);
    }
    state.activeMemoryStep = step.page;
    updateJudgeStatus(
      step.fault ? "Evidence board flagged a page fault" : "Page hit recorded",
      getMemoryStepMessage(memory.history, memory.stepIndex, memory.algorithm),
      memory.playing
    );
  } else {
    state.activeMemoryStep = null;
    memoryEventLog.innerHTML = "<p class=\"memory-log-empty\">Ready. Press Play or Next Step to begin.</p>";
    updateJudgeStatus("Memory chamber ready", "Frames are empty and waiting for the first page reference.");
  }
  updateMemoryReadout();
}

function renderMemoryHistory(history) {
  memoryHistoryGraph.innerHTML = "";
  state.memory.historyCells = [];

  if (!Array.isArray(history) || history.length === 0) {
    memoryHistoryGraph.textContent = "No page history is available.";
    return;
  }

  const scroller = document.createElement("div");
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  const body = document.createElement("tbody");
  const rows = [
    { label: "Page reference", value: (step) => step.page },
    ...Array.from({ length: state.memory.frameCount }, (_, frameIndex) => ({
      label: `Frame ${frameIndex + 1}`,
      value: (step) => step.frames[frameIndex] === "-" ? "Empty" : step.frames[frameIndex]
    })),
    { label: "Result", value: (step) => step.fault ? "Fault" : "Hit" }
  ];

  scroller.className = "memory-history-scroll";
  table.className = "memory-history-table";
  table.setAttribute("aria-label", "Page references and frame contents after each step");
  headRow.appendChild(document.createElement("th"));
  headRow.firstElementChild.scope = "col";
  headRow.firstElementChild.textContent = "Memory state";

  history.forEach((step, index) => {
    const heading = document.createElement("th");
    heading.scope = "col";
    heading.textContent = `Step ${index + 1}`;
    headRow.appendChild(heading);
    state.memory.historyCells.push([]);
  });
  head.appendChild(headRow);

  rows.forEach(({ label, value }) => {
    const row = document.createElement("tr");
    const rowHeading = document.createElement("th");
    rowHeading.scope = "row";
    rowHeading.textContent = label;
    row.appendChild(rowHeading);

    history.forEach((step, index) => {
      const cell = document.createElement("td");
      cell.textContent = value(step);
      cell.classList.add(step.fault ? "is-fault" : "is-hit");
      if (label === "Result") {
        cell.classList.add("memory-history-outcome");
      }
      cell.title = `Step ${index + 1}: ${step.fault ? "page fault" : "page hit"}`;
      state.memory.historyCells[index].push(cell);
      row.appendChild(cell);
    });
    body.appendChild(row);
  });

  table.append(head, body);
  scroller.appendChild(table);
  memoryHistoryGraph.appendChild(scroller);
}

function renderMemoryBoard(history, initialStep = -1) {
  memoryGrid.innerHTML = "";
  renderMemoryHistory(history);
  const memory = state.memory;
  if (!Array.isArray(history) || history.length === 0) {
    showNotice(memoryGrid, "No memory history available.");
    memory.frameNodes = [];
    updateMemoryReadout();
    return;
  }

  const frameGrid = document.createElement("div");
  frameGrid.className = "memory-frame-grid";
  memory.frameNodes = [];
  for (let frameIndex = 0; frameIndex < memory.frameCount; frameIndex += 1) {
    const frame = document.createElement("div");
    const label = document.createElement("span");
    const stage = document.createElement("div");
    const page = document.createElement("strong");
    frame.className = "memory-frame is-empty";
    label.className = "memory-frame-label";
    label.textContent = `Frame ${frameIndex + 1}`;
    stage.className = "memory-frame-stage";
    page.className = "memory-frame-page";
    page.textContent = "Empty";
    stage.appendChild(page);
    frame.append(label, stage);
    frameGrid.appendChild(frame);
    memory.frameNodes.push(frame);
  }
  memoryGrid.appendChild(frameGrid);

  memory.stepIndex = Math.max(-1, Math.min(initialStep, history.length - 1));
  memory.status = memory.stepIndex >= history.length - 1
    ? "complete"
    : memory.stepIndex >= 0 ? "paused" : "ready";
  memoryEventLog.innerHTML = "";
  if (memory.stepIndex < 0) {
    memoryEventLog.innerHTML = "<p class=\"memory-log-empty\">Ready. Press Play or Next Step to begin.</p>";
  } else {
    for (let stepIndex = 0; stepIndex <= memory.stepIndex; stepIndex += 1) {
      appendMemoryLogEntry(stepIndex);
    }
  }
  renderMemoryStep(false);
}

function clearMemoryTimer() {
  if (state.memory.timerId !== null) {
    window.clearTimeout(state.memory.timerId);
    state.memory.timerId = null;
  }
}

function scheduleMemoryTick() {
  clearMemoryTimer();
  state.memory.timerId = window.setTimeout(() => {
    state.memory.timerId = null;
    if (!state.memory.playing) {
      return;
    }
    advanceMemoryStep();
    if (state.memory.playing) {
      scheduleMemoryTick();
    }
  }, 850 / state.memory.speed);
}

function advanceMemoryStep() {
  const memory = state.memory;
  if (memory.stepIndex + 1 >= memory.history.length) {
    return false;
  }

  memory.stepIndex += 1;
  renderMemoryStep();
  if (memory.stepIndex >= memory.history.length - 1) {
    memory.playing = false;
    memory.status = "complete";
    clearMemoryTimer();
    updateMemoryReadout();
    updateJudgeStatus("Memory review complete", "All page references have been processed.");
  }
  return true;
}

function startMemoryPlayback() {
  if (!state.memory.history.length) {
    return;
  }
  if (state.memory.status === "complete") {
    resetMemorySimulation(false);
  }
  state.memory.playing = true;
  state.memory.status = "running";
  if (state.memory.stepIndex < 0) {
    advanceMemoryStep();
  }
  if (state.memory.playing) {
    scheduleMemoryTick();
  }
  updateMemoryReadout();
}

function pauseMemoryPlayback() {
  const memory = state.memory;
  if (!memory.playing) {
    return;
  }
  memory.playing = false;
  memory.status = "paused";
  clearMemoryTimer();
  updateMemoryReadout();
  updateJudgeStatus("Memory simulation paused", `Paused after step ${Math.max(0, memory.stepIndex + 1)}.`);
}

function resumeMemoryPlayback() {
  const memory = state.memory;
  if (!memory.history.length || memory.stepIndex >= memory.history.length - 1) {
    return;
  }
  memory.playing = true;
  memory.status = "running";
  updateMemoryReadout();
  updateJudgeStatus("Memory simulation resumed", "Continuing from the current page reference.", true);
  scheduleMemoryTick();
}

function resetMemorySimulation(updateStatus = true) {
  const memory = state.memory;
  memory.playing = false;
  clearMemoryTimer();
  memory.stepIndex = -1;
  memory.hits = 0;
  memory.faults = 0;
  memory.status = memory.history.length ? "ready" : "idle";
  if (memory.history.length) {
    renderMemoryBoard(memory.history, -1);
  } else {
    updateMemoryReadout();
  }
  if (updateStatus) {
    updateJudgeStatus("Memory simulation reset", "Frames, counters, and the execution log are back at the beginning.");
  }
}

function invalidateMemorySimulation() {
  clearMemoryTimer();
  state.memory.playing = false;
  state.memory.history = [];
  state.memory.algorithm = "";
  state.memory.reference = [];
  state.memory.frameCount = 0;
  state.memory.stepIndex = -1;
  state.memory.hits = 0;
  state.memory.faults = 0;
  state.memory.frameNodes = [];
  state.memory.historyCells = [];
  state.memory.status = "idle";
  state.memoryResult = null;
  state.memoryComparisonResult = null;
  state.memoryRequestId += 1;
  state.memoryComparisonRequestId += 1;
  memoryInputError.textContent = "";
  showNotice(memoryGrid, "Update the inputs, then run a memory simulation.");
  memoryEventLog.innerHTML = "<p class=\"memory-log-empty\">Run a memory simulation to see each page decision.</p>";
  memoryComparisonPanel.innerHTML = "";
  memoryStepCount.textContent = "0 / 0";
  memoryCurrentPage.textContent = "-";
  memoryPageHits.textContent = "0";
  memoryPageFaults.textContent = "0";
  memoryFaultRate.textContent = "0%";
  memoryRemaining.textContent = "0";
  setLoadingState(runMemoryButton, memoryGrid, false);
  memoryHistoryGraph.textContent = "Run a memory simulation to see page-by-page frame history.";
  compareMemoryButton.classList.remove("is-loading");
  updateMemoryControls();
}

function renderComparisonMode(results) {
  const token = nextRenderToken();
  comparisonGrid.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    showNotice(comparisonGrid, "Run comparison mode to see multi-algorithm results.");
    updateJudgeStatus("Comparison chamber idle", "No algorithm comparison has been prepared yet.");
    return;
  }

  const bestResult = [...results].sort((a, b) => {
    if (a.avg_waiting !== b.avg_waiting) {
      return a.avg_waiting - b.avg_waiting;
    }
    return a.avg_turnaround - b.avg_turnaround;
  })[0];

  results.forEach((result) => {
    if (!isTokenActive(token)) {
      return;
    }

    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const badge = document.createElement("span");
    const metrics = document.createElement("div");

    card.className = "comparison-card";
    header.className = "comparison-card-header";
    title.textContent = result.label;

    if (result.key === bestResult.key) {
      card.classList.add("is-best");
      badge.className = "comparison-badge";
      badge.textContent = "Best Fit";
      header.appendChild(badge);
    }

    metrics.className = "comparison-metrics";
    metrics.innerHTML = `
      <div class="comparison-metric">
        <span>Average Waiting</span>
        <strong>${formatNumber(result.avg_waiting)}</strong>
      </div>
      <div class="comparison-metric">
        <span>Turnaround</span>
        <strong>${formatNumber(result.avg_turnaround)}</strong>
      </div>
    `;

    header.prepend(title);
    card.appendChild(header);
    card.appendChild(createMiniGantt(result.timeline || []));
    card.appendChild(metrics);
    comparisonGrid.appendChild(card);
  });

  updateJudgeStatus(
    "Comparison mode complete",
    `${bestResult.label} delivered the best courtroom efficiency for the current case set.`
  );
}

function renderScheduleSummary(algo, data) {
  renderCaseMetrics(data.metrics || []);
  setMetrics([
    { label: "Strategy", value: algo.toUpperCase() },
    { label: "Avg Waiting", value: formatNumber(data.avg_waiting) },
    { label: "Avg Turnaround", value: formatNumber(data.avg_turnaround) },
    { label: "Cases Heard", value: String((data.metrics || []).length) }
  ]);

  setMessage([
    "Court is now in session.",
    "The timeline, active case, ready queue, and clock follow the selected algorithm in real time."
  ]);
}

function renderMemorySummary(algo, data) {
  const referenceCount = data.history.length;
  const hits = referenceCount - data.page_faults;
  const faultRate = referenceCount ? (data.page_faults / referenceCount) * 100 : 0;
  setMetrics([
    { label: "Memory Rule", value: algo.toUpperCase() },
    { label: "Full-Run Faults", value: String(data.page_faults ?? "-") },
    { label: "Full-Run Hits", value: String(hits) },
    { label: "Fault Rate", value: `${formatNumber(faultRate)}%` },
    { label: "References", value: String((data.history || []).length) },
    { label: "Frames", value: String(state.memory.frameCount) }
  ]);

  setMessage([
    "Evidence board updated.",
    "Page faults now flash clearly and each replacement is explained in context."
  ]);
}

function renderComparisonSummary(results) {
  const sorted = [...results].sort((a, b) => {
    if (a.avg_waiting !== b.avg_waiting) {
      return a.avg_waiting - b.avg_waiting;
    }
    return a.avg_turnaround - b.avg_turnaround;
  });

  const best = sorted[0];

  setMetrics([
    { label: "Comparison Set", value: "4 Algorithms" },
    { label: "Best Algorithm", value: best.label },
    { label: "Best Waiting", value: formatNumber(best.avg_waiting) },
    { label: "Best Turnaround", value: formatNumber(best.avg_turnaround) }
  ]);

  setMessage([
    "Comparison mode is complete.",
    `${best.label} currently offers the strongest courtroom flow for the entered case set.`
  ]);
}

function createFinalFramesRow(resultSource) {
  const wrapper = document.createElement("div");
  const label = document.createElement("div");
  const row = document.createElement("div");
  const finalFrames = Array.isArray(resultSource?.history) && resultSource.history.length
    ? resultSource.history[resultSource.history.length - 1].frames || []
    : [];

  label.className = "metric-label";
  label.textContent = "Final Evidence State";

  row.className = "memory-sequence-row";

  if (!finalFrames.length) {
    const empty = document.createElement("div");
    empty.className = "memory-sequence-block";
    empty.textContent = "-";
    row.appendChild(empty);
  } else {
    finalFrames.forEach((frameValue) => {
      const block = document.createElement("div");
      block.className = "memory-sequence-block";
      block.textContent = frameValue;
      row.appendChild(block);
    });
  }

  wrapper.appendChild(label);
  wrapper.appendChild(row);
  return wrapper;
}

function renderMemoryComparisonCards(data, referenceCount) {
  memoryComparisonPanel.innerHTML = "";

  const fifoData = data.fifo || {};
  const lruData = data.lru || {};
  const optimalData = data.optimal || {};

  const results = [
    {
      key: "fifo",
      label: "FIFO",
      source: fifoData,
      faults: typeof fifoData.page_faults === "number" ? fifoData.page_faults : "-",
      hits: Array.isArray(fifoData.history) ? fifoData.history.length - fifoData.page_faults : "-",
      rate: Array.isArray(fifoData.history) && referenceCount
        ? formatNumber((fifoData.page_faults / referenceCount) * 100)
        : "-"
    },
    {
      key: "lru",
      label: "LRU",
      source: lruData,
      faults: typeof lruData.page_faults === "number" ? lruData.page_faults : "-",
      hits: Array.isArray(lruData.history) ? lruData.history.length - lruData.page_faults : "-",
      rate: Array.isArray(lruData.history) && referenceCount
        ? formatNumber((lruData.page_faults / referenceCount) * 100)
        : "-"
    },
    {
      key: "optimal",
      label: "Optimal",
      source: optimalData,
      faults: typeof optimalData.page_faults === "number" ? optimalData.page_faults : "-",
      hits: Array.isArray(optimalData.history) ? optimalData.history.length - optimalData.page_faults : "-",
      rate: Array.isArray(optimalData.history) && referenceCount
        ? formatNumber((optimalData.page_faults / referenceCount) * 100)
        : "-"
    }
  ];

  const fifoFaults = typeof fifoData.page_faults === "number" ? fifoData.page_faults : Number.POSITIVE_INFINITY;
  const lruFaults = typeof lruData.page_faults === "number" ? lruData.page_faults : Number.POSITIVE_INFINITY;
  const optimalFaults = typeof optimalData.page_faults === "number" ? optimalData.page_faults : Number.POSITIVE_INFINITY;
  const bestFaults = Math.min(fifoFaults, lruFaults, optimalFaults);
  const bestStrategies = results.filter((result) => result.faults === bestFaults);
  const hasTie = bestStrategies.length > 1;

  const title = document.createElement("div");
  title.className = "section-heading section-heading-tight";
  title.innerHTML = `
    <h2>&#129504; Evidence Handling Comparison</h2>
    <span>${hasTie ? "Multiple optimal strategies" : "Comparison of courtroom evidence strategies"}</span>
  `;

  const grid = document.createElement("div");
  grid.className = "memory-comparison-grid";

  results.forEach((result) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const cardTitle = document.createElement("strong");
    const badge = document.createElement("span");
    const metrics = document.createElement("div");
    const isBest = result.faults === bestFaults;

    card.className = "memory-comparison-card";
    header.className = "memory-comparison-header";
    cardTitle.className = "memory-comparison-title";
    cardTitle.textContent = result.label;

    if (isBest) {
      card.classList.add("is-best");
      badge.className = "comparison-badge";
      badge.textContent = "Best Strategy";
      header.appendChild(badge);
    }

    metrics.className = "comparison-metrics";
    metrics.innerHTML = `
      <div class="comparison-metric">
        <span>Page Faults</span>
        <strong>${result.faults}</strong>
      </div>
      <div class="comparison-metric">
        <span>Hits</span>
        <strong>${result.hits}</strong>
      </div>
      <div class="comparison-metric">
        <span>Fault Rate</span>
        <strong>${result.rate}%</strong>
      </div>
    `;

    header.prepend(cardTitle);
    card.appendChild(header);
    card.appendChild(createFinalFramesRow(result.source));
    card.appendChild(metrics);
    grid.appendChild(card);
  });

  memoryComparisonPanel.appendChild(title);
  memoryComparisonPanel.appendChild(grid);
}

async function postJSON(route, payload) {
  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`The server returned an invalid response (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

function validateMemoryResult(data, reference, frameCount) {
  if (!data || !Array.isArray(data.history) || data.history.length !== reference.length) {
    throw new Error("The server returned an incomplete memory simulation history.");
  }

  let faultCount = 0;
  data.history.forEach((step, index) => {
    const validFrames = Array.isArray(step.frames)
      && step.frames.length === frameCount
      && step.frames.every((page) => typeof page === "string");
    const validFault = typeof step.fault === "boolean";
    const validFaultIndices = Array.isArray(step.fault_indices)
      && (step.fault
        ? step.fault_indices.length === 1
          && Number.isInteger(step.fault_indices[0])
          && step.fault_indices[0] >= 0
          && step.fault_indices[0] < frameCount
        : step.fault_indices.length === 0);

    if (step.page !== reference[index]
      || !validFrames
      || !validFault
      || !validFaultIndices
      || (step.fault && step.frames[step.fault_indices[0]] !== step.page)
      || (!step.fault && !step.frames.includes(step.page))) {
      throw new Error(`The server returned invalid frame data at page reference ${index + 1}.`);
    }
    if (step.fault) {
      faultCount += 1;
    }
  });

  if (data.page_faults !== faultCount) {
    throw new Error("The server returned inconsistent page-fault totals.");
  }
}

async function runSchedule() {
  const algo = scheduleSelect.value;
  const quantum = parseFloat(document.getElementById("quantum").value || "2");
  const payload = { cases: caseList, quantum };

  nextRenderToken();
  state.scheduleCases = caseList.map((item) => ({ ...item }));
  clearVisuals();
  setActiveView("gantt");
  showNotice(memoryGrid, "Run a memory algorithm to inspect the evidence board.");
  showNotice(comparisonGrid, "Run comparison mode to review multiple courtroom strategies.");
  setLoadingState(startHearingButton, ganttChart, true);
  updateJudgeStatus("Court is preparing", "The bench is organizing case records for the hearing.", true);

  try {
    const data = await postJSON(`/${algo}`, payload);
    state.scheduleResult = data;
    renderScheduleSummary(algo, data);
    renderGanttChart(data.timeline, data.metrics);
    startSimulation();
  } catch (err) {
    showNotice(ganttChart, "Unable to render hearing timeline.");
    setMetrics([{ label: "Status", value: "Simulation Error" }]);
    setMessage([`Error: ${err.message}`]);
    updateJudgeStatus("Court interrupted", "The hearing could not be completed due to an execution error.");
  } finally {
    setLoadingState(startHearingButton, ganttChart, false);
  }
}

async function runMemory() {
  const algo = memorySelect.value;
  const input = getMemorySimulationInput();
  if (input.error) {
    invalidateMemorySimulation();
    memoryInputError.textContent = input.error;
    setMessage([input.error]);
    updateJudgeStatus("Memory input needs attention", input.error);
    return;
  }

  const { frameCount, reference } = input;
  const requestId = ++state.memoryRequestId;
  state.memoryComparisonRequestId += 1;
  clearMemoryTimer();
  state.memory = {
    ...state.memory,
    history: [],
    algorithm: algo,
    reference,
    frameCount,
    stepIndex: -1,
    hits: 0,
    faults: 0,
    playing: false,
    timerId: null,
    frameNodes: [],
    status: "loading"
  };
  state.memoryResult = null;
  state.memoryComparisonResult = null;
  memoryInputError.textContent = "";
  memoryComparisonPanel.innerHTML = "";
  memoryEventLog.innerHTML = "<p class=\"memory-log-empty\">Preparing the selected page replacement strategy...</p>";
  updateMemoryReadout();

  nextRenderToken();
  clearVisuals();
  setActiveView("memory");
  showNotice(ganttChart, "Run a hearing strategy to view courtroom proceedings.");
  showNotice(comparisonGrid, "Run comparison mode to review multiple courtroom strategies.");
  setLoadingState(runMemoryButton, memoryGrid, true);
  updateJudgeStatus("Evidence board loading", "The court is reviewing incoming page references.", true);

  try {
    const data = await postJSON(`/${algo}`, {
      reference,
      frame_count: frameCount
    });
    if (requestId !== state.memoryRequestId) {
      return;
    }
    validateMemoryResult(data, reference, frameCount);
    state.memoryResult = data;
    state.memory.history = data.history || [];
    state.memory.status = "ready";
    renderMemorySummary(algo, data);
    renderMemoryBoard(data.history, -1);
    startMemoryPlayback();
  } catch (err) {
    if (requestId !== state.memoryRequestId) {
      return;
    }
    showNotice(memoryGrid, "Unable to render memory frame history.");
    memoryInputError.textContent = err.message;
    state.memory.status = "idle";
    updateMemoryReadout();
    setMetrics([{ label: "Status", value: "Memory Error" }]);
    setMessage([`Error: ${err.message}`]);
    updateJudgeStatus("Evidence board interrupted", "The memory board could not complete its review.");
  } finally {
    if (requestId === state.memoryRequestId) {
      setLoadingState(runMemoryButton, memoryGrid, false);
    }
  }
}

async function runMemoryComparison() {
  const input = getMemorySimulationInput();
  if (input.error) {
    memoryInputError.textContent = input.error;
    showMemoryComparisonNotice(input.error);
    return;
  }

  const { frameCount, reference } = input;
  const requestId = ++state.memoryComparisonRequestId;
  memoryInputError.textContent = "";

  compareMemoryButton.classList.add("is-loading");
  showMemoryComparisonNotice("Comparing FIFO, LRU, and Optimal memory strategies...");
  updateJudgeStatus("Memory comparison in session", "The court is comparing memory algorithms by page faults.", true);

  try {
    const data = await postJSON("/compare_memory", {
      reference,
      frame_count: frameCount
    });
    if (requestId !== state.memoryComparisonRequestId) {
      return;
    }
    ["fifo", "lru", "optimal"].forEach((algorithm) => {
      validateMemoryResult(data[algorithm], reference, frameCount);
    });
    state.memoryComparisonResult = data;
    renderMemoryComparisonCards(data, reference.length);

    const bestFaults = Math.min(
      data.fifo?.page_faults ?? Number.POSITIVE_INFINITY,
      data.lru?.page_faults ?? Number.POSITIVE_INFINITY,
      data.optimal?.page_faults ?? Number.POSITIVE_INFINITY
    );

    const bestLabels = [
      data.fifo?.page_faults === bestFaults ? "FIFO" : null,
      data.lru?.page_faults === bestFaults ? "LRU" : null,
      data.optimal?.page_faults === bestFaults ? "Optimal" : null
    ].filter(Boolean);
    const bestText = bestLabels.length > 1 ? "Multiple optimal strategies" : (bestLabels[0] || "-");

    setMetrics([
      { label: "Memory Comparison", value: "Complete" },
      { label: "Best Algorithm", value: bestText },
      { label: "Lowest Faults", value: String(bestFaults) },
      { label: "Frames", value: String(frameCount) }
    ]);

    setMessage([
      "Memory algorithm comparison is complete.",
      bestLabels.length > 1
        ? "Multiple strategies achieved equal efficiency."
        : `${bestLabels[0]} provided the most efficient evidence handling.`
    ]);

    updateJudgeStatus(
      "Memory comparison complete",
      bestLabels.length > 1
        ? "Multiple strategies achieved equal efficiency."
        : `${bestLabels[0]} provided the most efficient evidence handling.`
    );
  } catch (err) {
    if (requestId !== state.memoryComparisonRequestId) {
      return;
    }
    memoryInputError.textContent = err.message;
    showMemoryComparisonNotice("Unable to compare memory algorithms.");
    setMetrics([{ label: "Status", value: "Memory Comparison Error" }]);
    setMessage([`Error: ${err.message}`]);
    updateJudgeStatus("Memory comparison interrupted", "The court could not compare the memory algorithms.");
  } finally {
    compareMemoryButton.classList.remove("is-loading");
  }
}

async function runComparison() {
  const quantum = parseFloat(document.getElementById("quantum").value || "2");
  const payload = { cases: caseList, quantum };

  nextRenderToken();
  clearVisuals();
  setActiveView("comparison");
  showNotice(ganttChart, "Run a hearing strategy to view courtroom proceedings.");
  showNotice(memoryGrid, "Run a memory algorithm to inspect the evidence board.");
  setLoadingState(runComparisonButton, comparisonGrid, true);
  updateJudgeStatus("Comparison chamber active", "The bench is evaluating all major courtroom algorithms.", true);

  try {
    const results = await Promise.all(
      comparisonConfigs.map(async (config) => {
        const response = await postJSON(`/${config.key}`, payload);
        return {
          key: config.key,
          label: config.label,
          ...response
        };
      })
    );

    state.comparisonResult = results;
    renderComparisonSummary(results);
    renderComparisonMode(results);
  } catch (err) {
    showNotice(comparisonGrid, "Unable to complete comparison mode.");
    setMetrics([{ label: "Status", value: "Comparison Error" }]);
    setMessage([`Error: ${err.message}`]);
    updateJudgeStatus("Comparison interrupted", "The court could not compare all algorithms.");
  } finally {
    setLoadingState(runComparisonButton, comparisonGrid, false);
  }
}

function nextMemoryStep() {
  if (!state.memory.history.length || state.memory.playing) {
    return;
  }
  state.memory.status = "paused";
  advanceMemoryStep();
  if (state.memory.stepIndex < state.memory.history.length - 1) {
    updateJudgeStatus("Memory step reviewed", `Step ${state.memory.stepIndex + 1} of ${state.memory.history.length} is displayed.`);
  }
}

function showExistingViewIfAvailable(view) {
  if (state.memory.playing) {
    pauseMemoryPlayback();
  }
  nextRenderToken();
  setActiveView(view);

  if (view === "gantt") {
    if (state.scheduleResult?.timeline?.length) {
      renderGanttChart(state.scheduleResult.timeline, state.scheduleResult.metrics, state.simulation.time);
    } else {
      showNotice(ganttChart, "Run a hearing strategy to view courtroom proceedings.");
    }
    return;
  }

  if (view === "memory") {
    if (state.memoryResult?.history?.length) {
      renderMemoryBoard(state.memoryResult.history, state.memory.stepIndex);
    } else {
      showNotice(memoryGrid, "Run a memory algorithm to inspect the evidence board.");
    }
    return;
  }

  if (state.comparisonResult.length) {
    renderComparisonMode(state.comparisonResult);
  } else {
    showNotice(comparisonGrid, "Run comparison mode to review multiple courtroom strategies.");
  }
}

document.getElementById("add-case-btn").addEventListener("click", () => {
  const caseId = document.getElementById("case-id").value.trim();
  const arrival = parseFloat(document.getElementById("arrival-time").value);
  const burst = parseFloat(document.getElementById("duration").value);
  const priority = parseInt(document.getElementById("priority").value || "0", 10);

  if (!caseId || Number.isNaN(arrival) || Number.isNaN(burst) || burst <= 0) {
    setMetrics([{ label: "Status", value: "Input Error" }]);
    setMessage(["Please enter valid case details before adding a case."]);
    return;
  }

  caseList.push({ case_id: caseId, arrival, burst, priority });
  renderCases();
  setMetrics([
    { label: "Latest Filing", value: caseId },
    { label: "Total Cases", value: String(caseList.length) }
  ]);
  setMessage([`Case ${caseId} has been added to the courtroom docket.`]);
  updateJudgeStatus("Docket updated", `Case ${caseId} has been recorded and is ready for hearing.`);
});

viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showExistingViewIfAvailable(tab.dataset.view);
  });
});

scheduleSelect.addEventListener("change", updateSelectionPills);
memorySelect.addEventListener("change", () => {
  updateSelectionPills();
  invalidateMemorySimulation();
});
referenceInput.addEventListener("input", invalidateMemorySimulation);
frameCountInput.addEventListener("input", invalidateMemorySimulation);
startHearingButton.addEventListener("click", runSchedule);
runMemoryButton.addEventListener("click", runMemory);
compareMemoryButton.addEventListener("click", runMemoryComparison);
runComparisonButton.addEventListener("click", runComparison);
memoryPlayButton.addEventListener("click", startMemoryPlayback);
memoryPauseButton.addEventListener("click", pauseMemoryPlayback);
memoryResumeButton.addEventListener("click", resumeMemoryPlayback);
memoryResetButton.addEventListener("click", () => resetMemorySimulation());
memoryNextStepButton.addEventListener("click", nextMemoryStep);
memorySpeedSelect.addEventListener("change", () => {
  state.memory.speed = Number(memorySpeedSelect.value);
  if (state.memory.playing) {
    scheduleMemoryTick();
  }
});
simulationPlayButton.addEventListener("click", startSimulation);
simulationPauseButton.addEventListener("click", pauseSimulation);
simulationResumeButton.addEventListener("click", resumeSimulation);
simulationResetButton.addEventListener("click", resetSimulation);
simulationSpeedSelect.addEventListener("change", () => {
  state.simulation.speed = Number(simulationSpeedSelect.value);
});

window.deleteCase = deleteCase;

renderCases();
updateSelectionPills();
setActiveView("gantt");
setMetrics([{ label: "Status", value: "Awaiting simulation" }]);
setMessage([
  "JusticeFlow is ready.",
  "Use the tabs to focus the chamber, then run proceedings, evidence review, or comparison mode."
]);
showNotice(ganttChart, "Run a hearing strategy to view courtroom proceedings.");
showNotice(memoryGrid, "Run a memory algorithm to inspect the evidence board.");
showNotice(comparisonGrid, "Run comparison mode to review multiple courtroom strategies.");
showMemoryComparisonNotice("Memory comparison results will appear here.");
updateJudgeStatus("Court is awaiting session", "Select a proceeding, evidence view, or comparison mode to begin.");
updateMemoryControls();
