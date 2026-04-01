const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./db");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is working with SQLite!");
});

// Daily Tasks APIs
app.get("/api/daily", (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Fetch tasks
        const tasks = db.prepare("SELECT * FROM daily_tasks ORDER BY created_at DESC").all();
        
        // Fetch completions for today
        const completions = db.prepare(
            "SELECT task_id FROM daily_completions WHERE target_date = ?"
        ).all(today);
        
        res.json({
            tasks,
            completedIds: completions.map(c => c.task_id)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/daily/manage", (req, res) => {
    const { text, action, id } = req.body;
    try {
        if (action === 'add') {
            const info = db.prepare("INSERT INTO daily_tasks (text) VALUES (?)").run(text);
            res.json({ id: info.lastInsertRowid, text });
        } else if (action === 'delete') {
            db.prepare("DELETE FROM daily_tasks WHERE id = ?").run(id);
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/daily/toggle", (req, res) => {
    const { taskId, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    try {
        const exists = db.prepare(
            "SELECT * FROM daily_completions WHERE task_id = ? AND target_date = ?"
        ).get(taskId, targetDate);
        
        if (exists) {
            db.prepare(
                "DELETE FROM daily_completions WHERE task_id = ? AND target_date = ?"
            ).run(taskId, targetDate);
            res.json({ completed: false });
        } else {
            db.prepare(
                "INSERT INTO daily_completions (task_id, target_date, actual_completion_time) VALUES (?, ?, CURRENT_TIMESTAMP)"
            ).run(taskId, targetDate);
            res.json({ completed: true });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// New API for Pending Tasks
app.get("/api/daily/pending", (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Let's check last 7 days for simplicity
        const pending = [];
        const tasks = db.prepare("SELECT * FROM daily_tasks").all();
        
        for (let i = 1; i <= 7; i++) {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - i);
            const dateStr = pastDate.toISOString().split('T')[0];
            
            // For each task, check if it was completed on that date
            tasks.forEach(task => {
                // Only check tasks created before or on that date
                const createdAtDate = new Date(task.created_at).toISOString().split('T')[0];
                if (createdAtDate <= dateStr) {
                    const completed = db.prepare(
                        "SELECT * FROM daily_completions WHERE task_id = ? AND target_date = ?"
                    ).get(task.id, dateStr);
                    
                    if (!completed) {
                        pending.push({
                            taskId: task.id,
                            text: task.text,
                            date: dateStr,
                            day: pastDate.toLocaleDateString('en-US', { weekday: 'long' })
                        });
                    }
                }
            });
        }
        
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/daily/restore", (req, res) => {
    try {
        const defaults = ['Yswa', 'Vaq', 'Mul', 'Hadd', 'SB', 'LB', 'LA', 'MA', 'EA'];
        
        // Use a transaction for efficiency
        const insert = db.prepare("INSERT INTO daily_tasks (text) VALUES (?)");
        const insertMany = db.transaction((tasks) => {
            for (const task of tasks) insert.run(task);
        });
        
        insertMany(defaults);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/daily/stats", (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                t.text, 
                c.target_date, 
                c.actual_completion_time,
                (julianday(date(c.actual_completion_time)) - julianday(c.target_date)) as lagged_days
            FROM daily_completions c
            JOIN daily_tasks t ON c.task_id = t.id
            WHERE lagged_days > 0
        `).all();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => {
    console.log("Server running (SQLite mode) on port 5000");
});
