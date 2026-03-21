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
  const [quickOption, setQuickOption] = useState('asap');
  const [scheduledTime, setScheduledTime] = useState('');

  const segments = [
    { id: 'quick', label: 'Quick', icon: '⚡' },
    { id: 'short', label: 'Short', icon: '📅' },
    { id: 'long', label: 'Long', icon: '⏳' }
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
      quickOption: segment === 'quick' ? quickOption : null,
      scheduledTime: segment === 'quick' && quickOption === 'scheduled' ? scheduledTime : null,
      progress: (segment === 'short' || segment === 'long') ? 0 : null,
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

  const updateProgress = (id, value) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, progress: parseInt(value), completed: parseInt(value) === 100 } : todo
    ));
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

        {segment === 'quick' && (
          <div className="quick-options-container">
            <div className="quick-options-toggle">
              <button 
                type="button" 
                className={`option-btn ${quickOption === 'asap' ? 'active' : ''}`}
                onClick={() => setQuickOption('asap')}
              >
                ASAP
              </button>
              <button 
                type="button" 
                className={`option-btn ${quickOption === 'scheduled' ? 'active' : ''}`}
                onClick={() => setQuickOption('scheduled')}
              >
                Schedule
              </button>
            </div>
            {quickOption === 'scheduled' && (
              <input 
                type="datetime-local" 
                className="time-picker"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            )}
          </div>
        )}

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
                          {todo.quickOption === 'scheduled' && ` • Scheduled: ${new Date(todo.scheduledTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                        <span className={`todo-tag ${todo.segment || 'short'}`}>
                          {(segments.find(s => s.id === (todo.segment || 'short')) || {}).label}
                          {todo.quickOption === 'asap' && ' • ASAP'}
                        </span>
                      </div>
                      
                      {(todo.segment === 'short' || todo.segment === 'long') && (
                        <div className="progress-container">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={todo.progress || 0}
                            className="progress-slider"
                            onChange={(e) => updateProgress(todo.id, e.target.value)}
                          />
                          <span className="progress-value">{todo.progress || 0}%</span>
                        </div>
                      )}
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
