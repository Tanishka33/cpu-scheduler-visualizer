let processes = [];

const algorithmSelector = document.getElementById("algorithm");
const priorityInput = document.getElementById("priority");
const quantumInput = document.getElementById("quantumInput");

algorithmSelector.addEventListener("change", () => {
    if (algorithmSelector.value === "priority") {
        priorityInput.style.display = "inline";
    } else {
        priorityInput.style.display = "none";
    }

    if (algorithmSelector.value === "rr") {
        quantumInput.style.display = "block";
    } else {
        quantumInput.style.display = "none";
    }
});

function addProcess() {
    const pid = document.getElementById("pid").value;
    const arrival = parseInt(document.getElementById("arrival").value);
    const burst = parseInt(document.getElementById("burst").value);
    const priority = parseInt(document.getElementById("priority").value);

    if (!pid || isNaN(arrival) || isNaN(burst)) {
        alert("Please enter valid process details.");
        return;
    }

    processes.push({ pid, arrival, burst, priority });
    updateProcessTable();
}

function updateProcessTable() {
    const tbody = document.querySelector("#processTable tbody");
    tbody.innerHTML = "";

    processes.forEach((p, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${p.pid}</td>
          <td>${p.arrival}</td>
          <td>${p.burst}</td>
          <td>${p.priority || '-'}</td>
          <td>
            <button onclick="editProcess(${index})">Edit</button>
            <button onclick="deleteProcess(${index})">Delete</button>
          </td>
        `;

        tbody.appendChild(row);
    });
}

function deleteProcess(index) {
    processes.splice(index, 1);
    updateProcessTable();
}

function editProcess(index) {
    const p = processes[index];
    document.getElementById("pid").value = p.pid;
    document.getElementById("arrival").value = p.arrival;
    document.getElementById("burst").value = p.burst;
    document.getElementById("priority").value = p.priority;

    processes.splice(index, 1);
    updateProcessTable();
}

function clearOutput() {
    document.getElementById("ganttChart").innerHTML = "";
    document.getElementById("results").innerHTML = "";
    document.getElementById("chartContainer").innerHTML = "";
}

// You can now add simulateFCFS(), simulateSJF(), simulatePriority(), simulateRR()
// with gantt chart drawing and chart.js bar graph rendering here
// Let me know if you want the full simulation logic included again too
