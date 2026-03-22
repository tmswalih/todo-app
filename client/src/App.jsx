import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyTasks, setDailyTasks] = useState(() => {
    const saved = localStorage.getItem('dailyTasks');
    const parsed = saved ? JSON.parse(saved) : [];
    if (parsed.length > 0) return parsed;
    // Default tasks matching the Google Form
    return [
      { id: 1, text: 'Yswa' },
      { id: 2, text: 'Vaq' },
      { id: 3, text: 'Mul' },
      { id: 4, text: 'Hadd' },
      { id: 5, text: 'SB' },
      { id: 6, text: 'LB' },
      { id: 7, text: 'LA' },
      { id: 8, text: 'MA' },
      { id: 9, text: 'EA' }
    ];
  });
  const [dailyCompletions, setDailyCompletions] = useState(() => {
    const saved = localStorage.getItem('dailyCompletions');
    const resetDate = localStorage.getItem('lastResetDate');
    const today = new Date().toDateString();
    return (saved && resetDate === today) ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [input, setInput] = useState('');
  const [dailyInput, setDailyInput] = useState('');
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

  useEffect(() => {
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  useEffect(() => {
    localStorage.setItem('dailyCompletions', JSON.stringify(dailyCompletions));
    localStorage.setItem('lastResetDate', new Date().toDateString());
  }, [dailyCompletions]);

  // Check for reset every minute and auto-submit
  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem('lastResetDate');
      if (lastResetDate && lastResetDate !== today) {
        // Auto-submit previous day's data before resetting
        submitToGoogleForm(true);
        setDailyCompletions([]);
        localStorage.setItem('lastResetDate', today);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [dailyTasks, dailyCompletions]);

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
    setIsModalOpen(false);
  };

  const addDailyTask = (e) => {
    e.preventDefault();
    if (!dailyInput.trim()) return;
    const newTask = { id: Date.now(), text: dailyInput };
    setDailyTasks([...dailyTasks, newTask]);
    setDailyInput('');
  };

  const FORM_URL = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfu5cdhlxzsHjOk26_HV2mO969AWWRMz6VbmGLysktxpsqlqQ/formResponse';
  const FORM_MAPPING = {
    'Yswa': 'entry.1881917280',
    'Vaq': 'entry.279402658',
    'Mul': 'entry.1508951882',
    'Hadd': 'entry.1352894286',
    'SB': 'entry.1006985178',
    'LB': 'entry.593075016',
    'LA': 'entry.1240290504',
    'MA': 'entry.1824458312',
    'EA': 'entry.231506889'
  };

  const submitToGoogleForm = async (silent = false) => {
    const formData = new FormData();
    
    // Default values for all mapped fields
    Object.keys(FORM_MAPPING).forEach(taskName => {
      const entryId = FORM_MAPPING[taskName];
      const task = dailyTasks.find(t => t.text.trim().toLowerCase() === taskName.toLowerCase());
      const isCompleted = task && dailyCompletions.includes(task.id);
      formData.append(entryId, isCompleted ? 'Yes' : 'NO');
    });

    // Handle "Untitled Question" if exists
    const untitledTask = dailyTasks.find(t => t.text.toLowerCase().includes('untitled'));
    if (untitledTask) {
      formData.append('entry.693750357', dailyCompletions.includes(untitledTask.id) ? 'Option 1' : '');
    }

    try {
      // Using no-cors because Google Forms doesn't return CORS headers for formResponse
      await fetch(FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      if (!silent) alert('Submitted to Google Form successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      if (!silent) alert('Failed to submit to Google Form.');
    }
  };

  const toggleDailyTask = (id) => {
    if (isModifyMode) {
      setDailyTasks(dailyTasks.filter(task => task.id !== id));
      setDailyCompletions(dailyCompletions.filter(cid => cid !== id));
    } else {
      if (dailyCompletions.includes(id)) {
        setDailyCompletions(dailyCompletions.filter(cid => cid !== id));
      } else {
        setDailyCompletions([...dailyCompletions, id]);
      }
    }
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

  const restoreDefaults = () => {
    const defaults = [
      { id: '1', text: 'Yswa' },
      { id: '2', text: 'Vaq' },
      { id: '3', text: 'Mul' },
      { id: '4', text: 'Hadd' },
      { id: '5', text: 'SB' },
      { id: '6', text: 'LB' },
      { id: '7', text: 'LA' },
      { id: '8', text: 'MA' },
      { id: '9', text: 'EA' },
      { id: '10', text: 'Untitled Question' }
    ];
    setDailyTasks(defaults);
    setDailyCompletions([]);
  };

  return (
    <div className="app-container glass-panel">
      <header className="header">
        <h1>{view === 'home' ? 'Taskly' : 'Daily Tasks'}</h1>
        <div className="header-actions">
          {view === 'daily' && (
            <button 
              className={`modify-btn ${isModifyMode ? 'active' : ''}`}
              onClick={() => setIsModifyMode(!isModifyMode)}
            >
              {isModifyMode ? 'Done' : 'Modify'}
            </button>
          )}
          <LayoutGrid className="text-secondary" size={24} />
        </div>
      </header>

      <nav className="nav-bar">
        <button 
          className={`nav-btn ${view === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >
          Home
        </button>
        <button 
          className={`nav-btn ${view === 'daily' ? 'active' : ''}`}
          onClick={() => setView('daily')}
        >
          Daily
        </button>
      </nav>

      {view === 'home' ? (
        <>
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

          <button className="fab" onClick={() => setIsModalOpen(true)}>
            <Plus size={32} color="white" strokeWidth={3} />
          </button>

          <AnimatePresence>
            {isModalOpen && (
              <motion.div 
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
              >
                <motion.div 
                  className="modal-content glass-panel"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
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
                        autoFocus
                        onChange={(e) => setInput(e.target.value)}
                      />
                      <button type="submit" className="add-btn">
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="daily-tasks-page">
          <div className="daily-header-info">
            <span className="daily-date">{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="daily-day">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</span>
          </div>
          {isModifyMode && (
            <form className="daily-input-form" onSubmit={addDailyTask}>
              <div className="input-container">
                <input 
                  type="text" 
                  placeholder="New daily task..." 
                  value={dailyInput}
                  onChange={(e) => setDailyInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="add-btn">
                  <Plus size={20} strokeWidth={2.5} />
                </button>
              </div>
              <button 
                type="button" 
                className="restore-btn"
                onClick={restoreDefaults}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  border: '1px solid rgba(251, 191, 36, 0.2)'
                }}
              >
                Restore Form Template
              </button>
            </form>
          )}

          <div className="daily-list">
            <AnimatePresence initial={false}>
              {dailyTasks.length > 0 ? (
                dailyTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`daily-item ${isModifyMode ? 'modify' : ''}`}
                    onClick={() => toggleDailyTask(task.id)}
                  >
                    <div className={`todo-checkbox ${dailyCompletions.includes(task.id) ? 'checked' : ''}`}>
                      {dailyCompletions.includes(task.id) && <Check size={14} color="white" strokeWidth={3} />}
                      {isModifyMode && <Trash2 size={12} color="white" />}
                    </div>
                    <span className={`todo-text ${dailyCompletions.includes(task.id) && !isModifyMode ? 'completed' : ''}`}>
                      {task.text}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No daily tasks set. Click Modify to add some!</p>
                  <button 
                    onClick={restoreDefaults}
                    className="submit-form-btn"
                    style={{ marginTop: '16px' }}
                  >
                    Load Form Tasks
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
