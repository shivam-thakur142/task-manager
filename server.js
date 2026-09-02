// Loads settings from the private .env file
require("dotenv").config();

// Loads backend tools
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Creates the server
const app = express();
const PORT = process.env.PORT || 3000;

// Lets the server read JSON data and accept browser requests
app.use(express.json());
app.use(cors());

// Lets the server show the website files
app.use(express.static(__dirname));

// Defines how one task is stored in MongoDB
const taskSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// Sends all saved tasks to the website
app.get("/api/tasks", async (request, response) => {
    const tasks = await Task.find().sort({ createdAt: -1 });
    response.json(tasks);
});

// Saves a new task
app.post("/api/tasks", async (request, response) => {
    try {
        const task = await Task.create({
            text: request.body.text
        });

        response.status(201).json(task);
    } catch (error) {
        response.status(500).json({
            message: "Could not create task."
        });
    }
});

// Updates whether a task is completed
app.patch("/api/tasks/:id", async (request, response) => {
    try {
        const task = await Task.findByIdAndUpdate(
            request.params.id,
            { completed: request.body.completed },
            { new: true }
        );

        response.json(task);
    } catch (error) {
        response.status(500).json({
            message: "Could not update task."
        });
    }
});

// Deletes a task
app.delete("/api/tasks/:id", async (request, response) => {
    try {
        await Task.findByIdAndDelete(request.params.id);

        response.json({
            message: "Task deleted."
        });
    } catch (error) {
        response.status(500).json({
            message: "Could not delete task."
        });
    }
});

// Connects to MongoDB, then starts the server
async function startServer() {
    try {
        // Uses a separate database named taskflow
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "taskflow"
        });

        console.log("Connected to MongoDB");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

startServer();