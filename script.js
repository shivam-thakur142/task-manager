// Finds the main page elements
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const filterButtons = document.querySelectorAll(".filter");

// Holds tasks loaded from MongoDB
let tasks = [];
let currentFilter = "All";

// Loads tasks from the backend when the page opens
async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error("Could not load tasks:", error);
    }
}

// Adds a new task
taskForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();

    if (taskText === "") {
        return;
    }

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: taskText
            })
        });

        const newTask = await response.json();

        tasks.unshift(newTask);
        renderTasks();
        taskInput.value = "";
    } catch (error) {
        console.error("Could not add task:", error);
    }
});

// Shows tasks on the page
function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(function(task) {
        const shouldShow =
            currentFilter === "All" ||
            (currentFilter === "Pending" && !task.completed) ||
            (currentFilter === "Completed" && task.completed);

        if (!shouldShow) {
            return;
        }

        const taskItem = document.createElement("li");
        taskItem.classList.add("task-item");

        if (task.completed) {
            taskItem.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        const text = document.createElement("span");
        text.textContent = task.text;
        text.classList.add("task-text");

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");

        // Updates completed status in MongoDB
        checkbox.addEventListener("change", async function() {
            try {
                const response = await fetch(`/api/tasks/${task._id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        completed: checkbox.checked
                    })
                });

                const updatedTask = await response.json();

                tasks = tasks.map(function(item) {
                    return item._id === updatedTask._id ? updatedTask : item;
                });

                renderTasks();
            } catch (error) {
                console.error("Could not update task:", error);
            }
        });

        // Deletes the task from MongoDB
        deleteButton.addEventListener("click", async function() {
            try {
                await fetch(`/api/tasks/${task._id}`, {
                    method: "DELETE"
                });

                tasks = tasks.filter(function(item) {
                    return item._id !== task._id;
                });

                renderTasks();
            } catch (error) {
                console.error("Could not delete task:", error);
            }
        });

        taskItem.append(checkbox, text, deleteButton);
        taskList.appendChild(taskItem);
    });
}

// Changes the selected filter
filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        document.querySelector(".filter.active").classList.remove("active");
        button.classList.add("active");

        currentFilter = button.textContent;
        renderTasks();
    });
});

// Loads saved MongoDB tasks
loadTasks();