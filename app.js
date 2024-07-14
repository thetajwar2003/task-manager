const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { ObjectId } = require('mongodb');

dotenv.config();

// Logging configuration
const logger = console;

// Initialize express app
const app = express();

// Middleware for parsing JSON
app.use(express.json());

// CORS settings
const allowedOrigins = [
    'http://localhost:3000',
    'https://csc318-assignments.vercel.app',
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// MongoDB configuration
const uri = process.env.MONGODB_URI;
if (!uri) {
    logger.error('MONGODB_URI environment variable not set');
    throw new Error('MONGODB_URI environment variable not set');
}

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,  // Increase server selection timeout
    socketTimeoutMS: 60000,  // Increase socket timeout
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error(`Error connecting to MongoDB: ${ err }`);
        process.exit(1);
    });


const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
});

const Task = mongoose.model('Task', taskSchema);

// Helper function
const taskHelper = (task) => ({
    id: task._id.toString(),
    title: task.title,
    description: task.description,
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Task Manager API');
});

// Routes
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks.map(taskHelper));
    } catch (error) {
        logger.error(`Error fetching tasks: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const { title, description } = req.body;
        const newTask = new Task({ title, description });
        await newTask.save();
        res.status(201).json(taskHelper(newTask));
    } catch (error) {
        logger.error(`Error creating task: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

app.get('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        res.json(taskHelper(task));
    } catch (error) {
        logger.error(`Error fetching task: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

app.get('/tasks/name/:taskName', async (req, res) => {
    try {
        const { taskName } = req.params;
        const tasks = await Task.find({ title: taskName });
        if (tasks.length === 0) {
            return res.status(404).json({ detail: 'No tasks found with that name' });
        }
        res.json(tasks.map(taskHelper));
    } catch (error) {
        logger.error(`Error fetching tasks by name: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

app.put('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description } = req.body;
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { title, description },
            { new: true, runValidators: true }
        );
        if (!updatedTask) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        res.json(taskHelper(updatedTask));
    } catch (error) {
        logger.error(`Error updating task: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

app.delete('/tasks/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (!deletedTask) {
            return res.status(404).json({ detail: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting task: ${ error }`);
        res.status(500).json({ detail: error.message });
    }
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    logger.log(`Server running on port ${ port }`);
});
