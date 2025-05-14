function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Update task counts
function updateTaskCounts() {
    const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
    if (!activeUser) {
        console.error("No active user session found.");
        return;
    }
    console.log("Fetching task counts for:", activeUser.username);

    Promise.all([
        fetch('/get-assigned-tasks/', { method: 'GET', headers: {'Content-Type': 'application/json'} }),
        fetch('/get-completed-tasks/', { method: 'GET', headers: {'Content-Type': 'application/json'} })
    ])
    .then(([assignedResponse, completedResponse]) => {
        if (!assignedResponse.ok) throw new Error(`Assigned tasks fetch failed: ${assignedResponse.status}`);
        if (!completedResponse.ok) throw new Error(`Completed tasks fetch failed: ${completedResponse.status}`);
        return Promise.all([assignedResponse.json(), completedResponse.json()]);
    })
    .then(([assignedData, completedData]) => {
        console.log("Assigned tasks data:", assignedData);
        console.log("Completed tasks data:", completedData);
        const allCount = document.querySelector("#all-count");
        const assignedCount = document.querySelector("#assigned-count");
        const completedCount = document.querySelector("#completed-count");

        if (allCount) allCount.textContent = (assignedData.tasks.length + completedData.tasks.length);
        if (assignedCount) assignedCount.textContent = assignedData.tasks.length;
        if (completedCount) completedCount.textContent = completedData.tasks.length;
    })
    .catch(error => console.error("Error fetching task counts:", error));
}

// Display assigned tasks
function Assigned() {
    const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
    if (!activeUser) {
        console.error("No active user session found.");
        return;
    }
    console.log("Fetching assigned tasks for:", activeUser.username);

    fetch('/get-assigned-tasks/', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Assigned tasks response:", data);
        const taskTableBody = document.getElementById("taskTable").getElementsByTagName("tbody")[0];
        if (!taskTableBody) {
            console.error("Task table body not found in DOM!");
            return;
        }
        taskTableBody.innerHTML = "";
        if (data.status === 'success') {
            if (data.tasks.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="5">No assigned tasks found.</td>`;
                taskTableBody.appendChild(row);
            } else {
                data.tasks.forEach(task => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${task.title || 'N/A'}</td>
                        <td class="priority">${task.priority || 'N/A'}</td>
                        <td>${new Date(task.due_date).toISOString().split('T')[0] || 'N/A'}</td>
                        <td><button onclick="markAsComplete(${task.id})">Mark Complete</button></td>
                        <td style="color:Red;"><a href="/task-details/?taskId=${task.id}">Preview task</a></td>
                    `;
                    taskTableBody.appendChild(row);
                });
            }
        } else {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="5">Error: ${data.message}</td>`;
            taskTableBody.appendChild(row);
        }
    })
    .catch(error => console.error("Error fetching assigned tasks:", error));
}

// Mark task as complete
function markAsComplete(taskId) {
    fetch(`/mark-complete/${taskId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.status === 'success') {
            Assigned();
            updateTaskCounts();
        }
    })
    .catch(error => console.error("Error marking task as complete:", error));
}

// Display completed tasks
function Completed() {
    const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
    if (!activeUser) {
        console.error("No active user session found.");
        return;
    }
    console.log("Fetching completed tasks for:", activeUser.username);

    fetch('/get-completed-tasks/', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    })
    .then(response => {
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log("Completed tasks response:", data);
        const taskTableBody = document.getElementsByClassName("completed-list")[0].getElementsByTagName("tbody")[0];
        if (!taskTableBody) {
            console.error("Completed task table body not found in DOM!");
            return;
        }
        taskTableBody.innerHTML = "";
        if (data.status === 'success') {
            if (data.tasks.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="3">No completed tasks found.</td>`;
                taskTableBody.appendChild(row);
            } else {
                data.tasks.forEach(task => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${task.title || 'N/A'}</td>
                        <td>${new Date(task.due_date).toISOString().split('T')[0] || 'N/A'}</td>
                        <td>${new Date(task.due_date).toISOString().split('T')[0] || 'N/A'}</td>
                    `;
                    taskTableBody.appendChild(row);
                });
            }
        } else {
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="3">Error: ${data.message}</td>`;
            taskTableBody.appendChild(row);
        }
    })
    .catch(error => console.error("Error fetching completed tasks:", error));
}

// Filter by priority
function filterTable() {
    const filter = document.getElementById("priorityFilter").value.toLowerCase();
    const rows = document.querySelectorAll("#taskTable tbody tr");
    rows.forEach(row => {
        const priority = row.querySelector(".priority")?.textContent.toLowerCase() || '';
        row.style.display = (filter === "all" || priority === filter) ? "" : "none";
    });
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
    if (!activeUser) {
        alert("No active session found. Please log in.");
        window.location.href = "/";
        return;
    }
    console.log("Active user:", activeUser);

    if (document.getElementById("username") && document.getElementById("email")) {
        document.getElementById("username").textContent = activeUser.username || "N/A";
        document.getElementById("email").textContent = activeUser.email || "N/A";
    }

    if (document.getElementById("taskTable")) {
        Assigned();
        const priorityFilter = document.getElementById("priorityFilter");
        if (priorityFilter) priorityFilter.addEventListener("change", filterTable);
        else console.error("Priority filter not found in DOM!");
    }

    if (document.getElementsByClassName("completed-list").length > 0) {
        Completed();
    }

    if (document.getElementById("all-count") || document.getElementById("assigned-count") || document.getElementById("completed-count")) {
        updateTaskCounts();
    }
});