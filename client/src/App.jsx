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
  const [segment, setSegment] = useState('short');

  const segments = [
    { id: 'quick', label: 'Quick response needed', icon: '⚡' },
    { id: 'short', label: 'Short term', icon: '📅' },
    { id: 'long', label: 'Long term', icon: '⏳' }
  ];

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newTodo = {
      id: Date.now(),
      text: input,
      completed: false,
      segment: segment,
      createdAt: new Date().toISOString()
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

  const getGroupDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown Date';
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groupedTodos = segments.reduce((groups, seg) => {
    groups[seg.id] = todos.filter(todo => (todo.segment || 'short') === seg.id);
    return groups;
  }, {});

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container glass-panel">
      <header className="header">
        <h1>Taskly</h1>
        <LayoutGrid className="text-secondary" size={24} />
      </header>

      <form className="input-form" onSubmit={addTodo}>
        <div className="input-container">
          <input 
            type="text" 
            placeholder="Add a new task..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="add-btn">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="segment-selector">
          {segments.map((seg) => (
            <button
              key={seg.id}
              type="button"
              className={`segment-btn ${segment === seg.id ? 'active' : ''} ${seg.id}`}
              onClick={() => setSegment(seg.id)}
            >
              <span className="seg-icon">{seg.icon}</span>
              <span className="seg-label">{seg.label}</span>
            </button>
          ))}
        </div>
      </form>

      <div className="todo-list">
        <AnimatePresence initial={false}>
          {todos.length > 0 ? (
            segments.map((seg) => groupedTodos[seg.id].length > 0 && (
              <React.Fragment key={seg.id}>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`date-group-header segment-header ${seg.id}`}
                >
                  {seg.label}
                </motion.h3>
                {groupedTodos[seg.id].map((todo) => (
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
                    
                    <div className="todo-content">
                      <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                        {todo.text}
                      </span>
                      <div className="todo-meta">
                        <span className="todo-time">
                          {formatTime(todo.createdAt)}
                        </span>
                        <span className={`todo-tag ${todo.segment || 'short'}`}>
                          {(segments.find(s => s.id === (todo.segment || 'short')) || {}).label}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="delete-btn"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </React.Fragment>
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
