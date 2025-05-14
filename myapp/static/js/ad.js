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

// Update task count on admin dashboard
if (window.location.pathname.includes('/admin.html')) {
    document.addEventListener("DOMContentLoaded", function () {
        const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
        if (!activeUser) {
            alert("No active session found. Please log in.");
            window.location.href = "/";
            return;
        }
        fetch('/get-created-tasks/', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const countElement = document.querySelector(".summary-card p");
                if (countElement) {
                    countElement.textContent = data.tasks.length;
                }
            }
        })
        .catch(error => console.error("Error fetching task count:", error));
    });
}

// Add task form handling
if (window.location.pathname.includes('/add-task/')) {
    document.addEventListener('DOMContentLoaded', () => {
        const addTaskForm = document.getElementById('addTaskForm');
        const taskIdInput = document.getElementById('taskId');
        const createdByInput = document.getElementById('createdBy');
        const teacherInput = document.getElementById('teacherName');
        const suggestionsDiv = document.getElementById('teacherSuggestions');
        const activeUser = JSON.parse(sessionStorage.getItem('activeUser'));

        if (!activeUser || activeUser.role !== 'Admin') {
            alert('No admin is currently logged in.');
            window.location.href = '/';
            return;
        }

        createdByInput.value = activeUser.username;

        // Fetch max task ID
        fetch('/get-created-tasks/', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            const tasks = data.tasks || [];
            const maxId = tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) : 0;
            taskIdInput.value = maxId + 1;
        })
        .catch(error => console.error("Error fetching max task ID:", error));

        // AJAX autocomplete for teacher names
        teacherInput.addEventListener('input', () => {
            const query = teacherInput.value;
            if (query.length < 1) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            fetch(`/get-teachers/?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            })
            .then(response => response.json())
            .then(data => {
                suggestionsDiv.innerHTML = '';
                if (data.status === 'success' && data.teachers.length > 0) {
                    data.teachers.forEach(teacher => {
                        const div = document.createElement('div');
                        div.className = 'autocomplete-suggestion';
                        div.textContent = teacher.username;
                        div.onclick = () => {
                            teacherInput.value = teacher.username;
                            suggestionsDiv.style.display = 'none';
                        };
                        suggestionsDiv.appendChild(div);
                    });
                    suggestionsDiv.style.display = 'block';
                } else {
                    suggestionsDiv.style.display = 'none';
                }
            })
            .catch(error => console.error("Error fetching teachers:", error));
        });

        // Hide suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!teacherInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });

        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskData = {
                taskId: taskIdInput.value,
                taskTitle: document.getElementById('taskTitle').value,
                teacherName: teacherInput.value,
                priority: document.getElementById('priority').value,
                dueDate: document.getElementById('dueDate').value,
                description: document.getElementById('description').value
            };

            fetch('/add-task/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            })
            .then(response => response.json())
            .then(data => {
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = data.status === 'success'
                    ? 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #e0f7e0; color: #2e7d32; border: 1px solid #2e7d32;'
                    : 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
                messageDiv.textContent = data.message;
                addTaskForm.prepend(messageDiv);
                setTimeout(() => messageDiv.remove(), 5000);
                if (data.status === 'success') {
                    setTimeout(() => window.location.href = '/created-tasks/', 2000);
                }
            })
            .catch(error => console.error("Error adding task:", error));
        });
    });
}

// Display created tasks
// ... (previous sections remain the same)

// Display created tasks
if (window.location.pathname.includes('/created-tasks/')) {
    function filterTable() {
        const filter = document.getElementById("priorityFilter").value.toLowerCase();
        const rows = document.querySelectorAll("#taskTable tbody tr");
        rows.forEach(row => {
            const priority = row.querySelector(".priority").textContent.toLowerCase();
            row.style.display = (filter === "all" || priority === filter) ? "" : "none";
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        console.log("ad.js loaded for /created-tasks/");
        const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
        console.log("Active User:", activeUser);
        if (!activeUser) {
            alert("No active session found. Please log in.");
            window.location.href = "/";
            return;
        }
        if (activeUser.role !== 'Admin') {
            console.error("Unauthorized: Only Admins can view created tasks.");
            document.body.innerHTML = "<h1>Unauthorized Access</h1>";
            return;
        }
        console.log("Fetching tasks for:", activeUser.username);
        fetch('/get-created-tasks/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log("Fetch response status:", response.status);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("Fetch response data:", data);
            if (data.status === 'success') {
                const taskTable = document.getElementById("taskTable");
                if (!taskTable) {
                    console.error("taskTable element not found in DOM!");
                    document.body.innerHTML = "<h1>Error: Task table not found!</h1>";
                    return;
                }
                const tbody = taskTable.getElementsByTagName("tbody")[0];
                const priorityFilter = document.getElementById("priorityFilter");
                if (!priorityFilter) {
                    console.error("priorityFilter element not found in DOM!");
                    document.body.innerHTML = "<h1>Error: Priority filter not found!</h1>";
                    return;
                }
                tbody.innerHTML = "";
                if (data.tasks.length === 0) {
                    const row = tbody.insertRow();
                    row.innerHTML = `<td colspan="6">No tasks created yet.</td>`;
                } else {
                    data.tasks.forEach(task => {
                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td>${task.title || 'N/A'}</td>
                            <td class="priority">${task.priority || 'N/A'}</td>
                            <td>${new Date(task.due_date).toISOString().split('T')[0] || 'N/A'}</td>
                            <td>${task.assignee__username || 'N/A'}</td>
                            <td><a href="/task-details/?taskId=${task.id || 0}">View Task</a></td>
                            <td>
                                <button onclick="editTask(${task.id || 0})">Edit</button>
                                <button onclick="removeTask(${task.id || 0})">Remove</button>
                            </td>
                        `;
                    });
                }
                priorityFilter.addEventListener("change", filterTable);
            } else {
                console.error("Fetch failed:", data.message);
                document.body.innerHTML = `<h1>Error: ${data.message}</h1>`;
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
        });
    });

    window.editTask = function(taskId) {
        // Store taskId in sessionStorage (optional, for redundancy)
        sessionStorage.setItem("editTaskId", taskId);
        // Navigate with taskId as query parameter
        window.location.href = `/edit-task/?taskId=${taskId}`;
    };

    window.removeTask = function(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            fetch(`/delete-task/${taskId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.status === 'success') {
                    window.location.reload();
                }
            })
            .catch(error => console.error("Error deleting task:", error));
        }
    };
}

// Task details
if (window.location.pathname.includes('/task-details/')) {
    document.addEventListener("DOMContentLoaded", function() {
        console.log("ad.js loaded for /task-details/");
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('taskId');
        console.log("Task ID from URL:", taskId);
        if (!taskId) {
            document.body.innerHTML = "<h1>Error: No task ID provided</h1>";
            return;
        }
        const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
        console.log("Active User:", activeUser);
        if (!activeUser) {
            alert("No active session found. Please log in.");
            window.location.href = "/";
            return;
        }
        console.log("Fetching task details for task ID:", taskId);
        fetch(`/get-task-details/?taskId=${taskId}`, {  // Updated endpoint
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log("Fetch response status:", response.status);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("Fetch response data:", data);
            const aboutAssignmentDiv = document.querySelector('.about-Assignment');
            if (!aboutAssignmentDiv) {
                console.error("about-Assignment div not found in DOM!");
                document.body.innerHTML = "<h1>Error: Task details container not found!</h1>";
                return;
            }
            if (data.status === 'success') {
                const task = data.task;
                document.getElementById('taskTitleHeader').textContent = task.title;
                aboutAssignmentDiv.innerHTML = `
                    <h2>Task Details</h2>
                    <p><strong>Task ID:</strong> ${task.id}</p>
                    <p><strong>Title:</strong> ${task.title}</p>
                    <p><strong>Teacher Name:</strong> ${task.assignee__username}</p>
                    <p><strong>Assigned by:</strong> ${task.creator__username}</p>
                    <p><strong>Priority:</strong> ${task.priority}</p>
                    <p><strong>Due Date:</strong> ${new Date(task.due_date).toISOString().split('T')[0]}</p>
                    <p><strong>Completed:</strong> ${task.completed ? 'Yes' : 'No'}</p>
                    <h3>Description:</h3>
                    <div class="description-content">${task.description || 'No description provided'}</div>
                `;
            } else {
                console.error("Fetch failed:", data.message);
                aboutAssignmentDiv.innerHTML = `<h2>Task Details</h2><p>${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
        });
    });
}

// Edit task (placeholder, to be implemented)

if (window.location.pathname.includes('/edit-task/')) {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("ad.js loaded for /edit-task/");
        const editTaskForm = document.getElementById('editTaskForm');
        const taskIdInput = document.getElementById('taskId');
        const createdByInput = document.getElementById('createdBy');
        const teacherInput = document.getElementById('teacherName');
        const suggestionsDiv = document.getElementById('teacherSuggestions');
        const activeUser = JSON.parse(sessionStorage.getItem('activeUser'));

        if (!activeUser || activeUser.role !== 'Admin') {
            alert('No admin is currently logged in.');
            window.location.href = '/';
            return;
        }

        createdByInput.value = activeUser.username;


        editTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Form submitted with data:", {
                taskId: taskIdInput.value,
                taskTitle: document.getElementById('taskTitle').value,
                teacherName: document.getElementById('teacherName').value,
                priority: document.getElementById('priority').value,
                dueDate: document.getElementById('dueDate').value,
                description: document.getElementById('description').value
            });
            const taskData = {
                taskId: taskIdInput.value,
                taskTitle: document.getElementById('taskTitle').value,
                teacherName: document.getElementById('teacherName').value,
                priority: document.getElementById('priority').value,
                dueDate: document.getElementById('dueDate').value,
                description: document.getElementById('description').value
            };

            fetch('/edit-task/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            })
            .then(response => {
                console.log("Fetch response status:", response.status);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log("Fetch response data:", data);
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = data.status === 'success'
                    ? 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #e0f7e0; color: #2e7d32; border: 1px solid #2e7d32;'
                    : 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
                messageDiv.textContent = data.message;
                editTaskForm.prepend(messageDiv);
                setTimeout(() => messageDiv.remove(), 5000);
                if (data.status === 'success') {
                    setTimeout(() => window.location.href = '/created-tasks/', 2000);
                }
            })
            .catch(error => {
                console.error("Fetch error:", error);
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 14px; text-align: center; font-family: Arial, sans-serif; background-color: #ffebee; color: #d32f2f; border: 1px solid #d32f2f;';
                messageDiv.textContent = `Error: ${error.message}`;
                editTaskForm.prepend(messageDiv);
                setTimeout(() => messageDiv.remove(), 5000);
            });
        });
    });
}

// Profile admin
if (window.location.pathname.includes('/profileAdmin/')) {
    document.addEventListener("DOMContentLoaded", function () {
        const activeUser = JSON.parse(sessionStorage.getItem("activeUser"));
        if (activeUser) {
            document.getElementById("username").textContent = activeUser.username;
            document.getElementById("email").textContent = activeUser.email;
        }
    });
}