import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newTodo = {
      id: Date.now(),
      text: input,
      completed: false
    };
    
    setTodos([newTodo, ...todos]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="app-container glass-panel">
      <header className="header">
        <h1>Taskly</h1>
        <LayoutGrid className="text-secondary" size={24} />
      </header>

      <form className="input-container" onSubmit={addTodo}>
        <input 
          type="text" 
          placeholder="Add a new task..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="add-btn">
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </form>

      <div className="todo-list">
        <AnimatePresence initial={false}>
          {todos.length > 0 ? (
            todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="todo-item"
              >
                <div 
                  className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed && <Check size={14} color="white" strokeWidth={3} />}
                </div>
                
                <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                  {todo.text}
                </span>

                <button 
                  className="delete-btn"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <LayoutGrid size={48} opacity={0.2} />
              <p>No tasks yet. Start by adding one!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
