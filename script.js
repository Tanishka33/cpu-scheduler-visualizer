let processes = [];

function addProcess() {
  const pid = document.getElementById("pid").value;
  const arrival = parseInt(document.getElementById("arrival").value);
  const burst = parseInt(document.getElementById("burst").value);
  const priority = parseInt(document.getElementById("priority").value);

  if (!pid || isNaN(arrival) || isNaN(burst)) {
    alert("Please fill required fields correctly.");
    return;
  }

  processes.push({ pid, arrival, burst, priority });
  renderProcessTable();
}

function renderProcessTable() {
  const table = document.getElementById("processTable");
  table.innerHTML = "";
  processes.forEach((p, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.priority ?? "-"}</td>
      <td><button onclick="deleteProcess(${index})">Delete</button></td>
    `;
    table.appendChild(row);
  });
}

function deleteProcess(index) {
  processes.splice(index, 1);
  renderProcessTable();
}

function calculate() {
  const algo = document.getElementById("algo").value;
  const quantum = parseInt(document.getElementById("quantum").value) || 2;
  let result = [];
  let gantt = [];

  switch (algo) {
    case "fcfs":
      ({ result, gantt } = simulateFCFS(processes));
      break;
    case "sjf-non-preemptive":
      ({ result, gantt } = simulateSJF(processes, false));
      break;
    case "sjf-preemptive":
      ({ result, gantt } = simulateSJF(processes, true));
      break;
    case "priority-non-preemptive":
      ({ result, gantt } = simulatePriority(processes, false));
      break;
    case "priority-preemptive":
      ({ result, gantt } = simulatePriority(processes, true));
      break;
    case "rr":
      ({ result, gantt } = simulateRR(processes, quantum));
      break;
  }

  displayResults(result, gantt);
}


function displayResults(result, ganttChartData) {
  const resultBody = document.querySelector("#resultTable tbody");
  resultBody.innerHTML = "";
  let totalWT = 0,
    totalTAT = 0;

  result.forEach((p) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.pid}</td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.completion}</td>
      <td>${p.wt}</td>
      <td>${p.tat}</td>
    `;
    resultBody.appendChild(row);
    totalWT += p.wt;
    totalTAT += p.tat;
  });

  document.getElementById("avgTat").value = (totalTAT / result.length).toFixed(2);
  document.getElementById("avgWt").value = (totalWT / result.length).toFixed(2);
  document.getElementById("throughput").value = (
    result.length / (Math.max(...result.map((p) => p.completion)) || 1)
  ).toFixed(2);

  renderGanttChart(ganttChartData);
  renderChart(totalTAT / result.length, totalWT / result.length);
}

function renderGanttChart(gantt) {
  const container = document.getElementById("ganttChart");
  container.innerHTML = "";
  gantt.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "gantt-block";
    div.innerText = `${entry.pid} ${entry.start}-${entry.end}`;
    container.appendChild(div);
  });
}

function renderChart(avgTat, avgWt) {
  const ctx = document.getElementById("chartCanvas").getContext("2d");
  if (window.chartObj) window.chartObj.destroy();
  window.chartObj = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Avg Turnaround Time", "Avg Waiting Time"],
      datasets: [{
        label: "Time (ms)",
        data: [avgTat, avgWt],
        backgroundColor: ["#007bff", "#28a745"]
      }]
    }
  });
}

// ---------------------------- Algorithms --------------------------------

function simulateFCFS(input) {
  const proc = [...input].sort((a, b) => a.arrival - b.arrival);
  let time = 0, result = [], gantt = [];

  proc.forEach((p) => {
    if (time < p.arrival) time = p.arrival;
    let start = time;
    time += p.burst;
    result.push({
      ...p,
      completion: time,
      tat: time - p.arrival,
      wt: start - p.arrival
    });
    gantt.push({ pid: p.pid, start, end: time });
  });

  return { result, gantt };
}

function simulateSJF(input, isPreemptive) {
  const n = input.length;
  const proc = input.map(p => ({ ...p, remaining: p.burst }));
  let time = 0, completed = 0, gantt = [], result = [], prev = null;

  while (completed < n) {
    let candidates = proc.filter(p => p.remaining > 0 && p.arrival <= time);
    let current = candidates.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival)[0];

    if (!current) {
      time++;
      continue;
    }

    if (prev !== current.pid) {
      gantt.push({ pid: current.pid, start: time });
    }

    if (isPreemptive) {
      current.remaining--;
      time++;
      if (current.remaining === 0) {
        current.completion = time;
        current.tat = time - current.arrival;
        current.wt = current.tat - current.burst;
        result.push(current);
        completed++;
        gantt[gantt.length - 1].end = time;
      } else {
        gantt[gantt.length - 1].end = time;
      }
    } else {
      let start = time;
      time += current.remaining;
      current.completion = time;
      current.tat = time - current.arrival;
      current.wt = current.tat - current.burst;
      current.remaining = 0;
      result.push(current);
      completed++;
      gantt[gantt.length - 1].end = time;
    }

    prev = current.pid;
  }

  return { result, gantt };
}

function simulatePriority(input, isPreemptive) {
  const n = input.length;
  const proc = input.map(p => ({ ...p, remaining: p.burst }));
  let time = 0, completed = 0, gantt = [], result = [], prev = null;

  while (completed < n) {
    let candidates = proc.filter(p => p.remaining > 0 && p.arrival <= time);
    let current = candidates.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0];

    if (!current) {
      time++;
      continue;
    }

    if (prev !== current.pid) gantt.push({ pid: current.pid, start: time });

    if (isPreemptive) {
      current.remaining--;
      time++;
      if (current.remaining === 0) {
        current.completion = time;
        current.tat = time - current.arrival;
        current.wt = current.tat - current.burst;
        result.push(current);
        completed++;
        gantt[gantt.length - 1].end = time;
      } else {
        gantt[gantt.length - 1].end = time;
      }
    } else {
      let start = time;
      time += current.remaining;
      current.completion = time;
      current.tat = time - current.arrival;
      current.wt = current.tat - current.burst;
      current.remaining = 0;
      result.push(current);
      completed++;
      gantt[gantt.length - 1].end = time;
    }

    prev = current.pid;
  }

  return { result, gantt };
}

function simulateRR(input, quantum) {
  const proc = input.map(p => ({ ...p, remaining: p.burst }));
  const queue = [];
  let time = 0, result = [], gantt = [];

  proc.sort((a, b) => a.arrival - b.arrival);
  queue.push(proc.shift());

  while (queue.length || proc.length) {
    if (!queue.length) {
      queue.push(proc.shift());
      time = Math.max(time, queue[0].arrival);
    }

    const curr = queue.shift();
    let start = time;
    const execute = Math.min(quantum, curr.remaining);
    curr.remaining -= execute;
    time += execute;
    gantt.push({ pid: curr.pid, start, end: time });

    proc.forEach((p, i) => {
      if (p.arrival <= time) {
        queue.push(proc.splice(i, 1)[0]);
      }
    });

    if (curr.remaining > 0) {
      queue.push(curr);
    } else {
      curr.completion = time;
      curr.tat = time - curr.arrival;
      curr.wt = curr.tat - curr.burst;
      result.push(curr);
    }
  }

  return { result, gantt };
}
