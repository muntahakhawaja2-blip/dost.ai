import React, { useState, useEffect, useRef } from 'react';

// --- OFFICIAL BRANDING CONFIGURATION ---
const BOT_NAME = "DOST AI"; 
const BOT_SLOGAN = "Your Socratic Guide to Smarter Studying.";
// ---------------------------------------

export default function App() {
  // Theme & Layout State
  const [isDarkMode, setIsDarkMode] = useState(true); // Toggle between Professional Dark & Light mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true); 
  const [timeGreeting, setTimeGreeting] = useState("Welcome");

  // Dynamic Time Greeting Logic (Subah, dopahar ya shaam ka pata lagane ke liye)
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setTimeGreeting("Good Morning");
    else if (hrs < 17) setTimeGreeting("Good Afternoon");
    else setTimeGreeting("Good Evening");
  }, []);

  // --- INTERACTIVE SYNTHETIC SOUND ENGINE ---
  // Browser ke built-in audio node se ek clean, soft "pop" sound generate karne ke liye
  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      // Sound frequency starts high and drops quickly for a "bubble pop" effect
      osc.frequency.setValueAtTime(550, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.log("Audio not supported or blocked by browser user gesture.");
    }
  };

  // --- DRAG-TO-RESIZE PRODUCTIVITY TOOLKIT ---
  const [drawerWidth, setDrawerWidth] = useState(320); 
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault(); 
  };

  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth >= 240 && newWidth <= 500) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  // -------------------------------------------

  // Chat State
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "Workspace Introduction",
      messages: [
        { id: 1, sender: 'bot', text: `Welcome to your professional workspace. I am ${BOT_NAME}, your Socratic mentor. Let's analyze some scientific theories, organize your daily targets, or build an active study schedule together.` }
      ]
    }
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Pomodoro Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Checklist State
  const [tasks, setTasks] = useState([
    { id: 1, text: "Explore linear equations", completed: false },
    { id: 2, text: "Plan weekly goals", completed: true },
  ]);
  const [newTaskText, setNewTaskText] = useState("");

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isLoading]);

  // Pomodoro Timer Logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setTimerActive(false);
      playPopSound(); // Alarm popup sound
      if (!isBreak) {
        alert("Focus session complete! Time for a 5-minute break.");
        setTimeLeft(5 * 60);
        setIsBreak(true);
      } else {
        alert("Break is over. Back to focus for 25 minutes!");
        setTimeLeft(25 * 60);
        setIsBreak(false);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, isBreak]);

  const toggleTimer = () => {
    playPopSound();
    setTimerActive(!timerActive);
  };
  
  const resetTimer = () => {
    playPopSound();
    setTimerActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getActiveChat = () => chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = async (textToSend) => {
    const currentText = textToSend || inputMessage;
    if (!currentText.trim()) return;

    playPopSound(); // Interactive click-pop feedback!

    const currentChat = getActiveChat();
    const newUserMessage = { id: Date.now(), sender: 'user', text: currentText };
    
    const updatedMessages = [...currentChat.messages, newUserMessage];
    setChats(chats.map(c => c.id === currentChat.id ? { ...c, messages: updatedMessages } : c));
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('https://dost-ai-backend.vercel.app/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await response.json();
      
      playPopSound(); // Bot message arrival sound!

      const newBotMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || "Something went wrong. Can you repeat that?"
      };

      setChats(prevChats => prevChats.map(c => 
        c.id === currentChat.id ? { ...c, messages: [...updatedMessages, newBotMessage] } : c
      ));
    } catch (error) {
      console.error("API error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm having trouble connecting right now. Make sure your backend server is running in the other terminal window!"
      };
      setChats(prevChats => prevChats.map(c => 
        c.id === currentChat.id ? { ...c, messages: [...updatedMessages, errorMessage] } : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = (prompt) => {
    handleSendMessage(prompt);
  };

  const createNewChat = () => {
    playPopSound();
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: `Session ${chats.length + 1}`,
      messages: [{ id: 1, sender: 'bot', text: `New workspace session initiated. I am ${BOT_NAME}. Let me know what concept we're working on today.` }]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    playPopSound();
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText("");
  };

  const toggleTask = (id) => {
    playPopSound();
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    playPopSound();
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 font-sans overflow-hidden ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. LEFT SIDEBAR: Professional Dark Panel */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) md:relative md:translate-x-0 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none md:w-0'}`}>
        <div className="flex flex-col h-full p-4 min-w-[288px]">
          <div className="flex items-center justify-between mb-6">
            <span className="text-md font-bold tracking-wider flex items-center gap-2.5">
              <span className="text-xl">🧠</span> {BOT_NAME}
              {/* Interactive Pulsing Online Indicator */}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" title={`${BOT_NAME} is Online`}></span>
              </span>
            </span>
            <button onClick={() => { playPopSound(); setIsSidebarOpen(false); }} className={`md:hidden text-xs px-2 py-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-900 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}>
              ✕
            </button>
          </div>

          <button 
            onClick={createNewChat}
            className={`w-full py-2.5 px-4 mb-6 text-white rounded-lg font-medium transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 shadow-sm ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/10' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            ➕ New Session
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Workspace History</p>
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  playPopSound();
                  setActiveChatId(chat.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all duration-150 truncate block hover:translate-x-0.5 ${chat.id === activeChatId ? (isDarkMode ? 'bg-slate-900 text-emerald-400 border border-slate-800/80 shadow-inner' : 'bg-slate-100 text-emerald-600 border border-slate-200') : (isDarkMode ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}`}
              >
                📁 {chat.title}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-1">
            <p>🌍 {BOT_SLOGAN}</p>
            <p>© 2026 {BOT_NAME} Workspace</p>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
        
        {/* HEADER */}
        <header className={`h-16 border-b flex items-center justify-between px-4 md:px-6 backdrop-blur-md z-10 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white/60 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => { playPopSound(); setIsSidebarOpen(!isSidebarOpen); }} className={`p-1.5 rounded-lg transition-all active:scale-90 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
              ☰
            </button>
            <h1 className="font-semibold text-sm truncate max-w-xs md:max-w-md">
              {getActiveChat()?.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Interactive Theme Toggle Button */}
            <button 
              onClick={() => { playPopSound(); setIsDarkMode(!isDarkMode); }}
              className={`p-2 rounded-lg transition-all active:scale-90 text-xs font-semibold flex items-center gap-1.5 ${isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Toggle theme mode"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            
            <button 
              onClick={() => { playPopSound(); setIsDrawerOpen(!isDrawerOpen); }}
              className={`px-3 py-2 text-xs rounded-lg transition duration-150 flex items-center gap-1.5 font-medium ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              ⏱️ Toolkit {isDrawerOpen ? '→' : '←'}
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {getActiveChat()?.messages.length <= 1 && (
            <div className="max-w-2xl mx-auto space-y-4 py-6 animate-slide-up-fade">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold tracking-tight">{timeGreeting}! Meet {BOT_NAME}</h2>
                <p className="text-xs text-slate-500">{BOT_SLOGAN}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={() => handleTemplateClick("Let's plan a simple Daily To-Do List to organize my chaos today.")}
                  className={`p-4 rounded-xl text-left transform hover:-translate-y-0.5 hover:shadow-md active:scale-98 transition-all duration-300 border ${isDarkMode ? 'bg-slate-850/50 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/5' : 'bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/10'}`}
                >
                  <span className="text-md">📝</span>
                  <h3 className="font-semibold text-xs mt-2">Daily To-Do List</h3>
                  <p className="text-xs text-slate-500 mt-1">Structure habits and routine productivity checks.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Can you explain a complex academic concept with a simple analogy?")}
                  className={`p-4 rounded-xl text-left transform hover:-translate-y-0.5 hover:shadow-md active:scale-98 transition-all duration-300 border ${isDarkMode ? 'bg-slate-850/50 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/5' : 'bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/10'}`}
                >
                  <span className="text-md">💡</span>
                  <h3 className="font-semibold text-xs mt-2">Concept Explainer</h3>
                  <p className="text-xs text-slate-500 mt-1">Socratic help to digest tough scientific or math theories.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Let's build a productive Study Planner for my upcoming exams.")}
                  className={`p-4 rounded-xl text-left transform hover:-translate-y-0.5 hover:shadow-md active:scale-98 transition-all duration-300 border ${isDarkMode ? 'bg-slate-850/50 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/5' : 'bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/10'}`}
                >
                  <span className="text-md">📅</span>
                  <h3 className="font-semibold text-xs mt-2">Study Planner</h3>
                  <p className="text-xs text-slate-500 mt-1">Organize study targets for tough exam schedules.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Give me a quick 3-question quiz on a random subject to test my knowledge!")}
                  className={`p-4 rounded-xl text-left transform hover:-translate-y-0.5 hover:shadow-md active:scale-98 transition-all duration-300 border ${isDarkMode ? 'bg-slate-850/50 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/5' : 'bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50/10'}`}
                >
                  <span className="text-md">⚡</span>
                  <h3 className="font-semibold text-xs mt-2">Quick Quiz</h3>
                  <p className="text-xs text-slate-500 mt-1">Test your recall on major core concepts.</p>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {getActiveChat()?.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up-fade`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md leading-relaxed text-xs md:text-sm ${msg.sender === 'user' ? (isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white rounded-br-none' : 'bg-emerald-500 hover:bg-emerald-600 text-white rounded-br-none') : (isDarkMode ? 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm')}`}>
                  {msg.sender === 'bot' && (
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <span>🤖 {BOT_NAME}</span>
                    </div>
                  )}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-slide-up-fade">
                <div className={`border rounded-2xl rounded-bl-none p-4 max-w-[85%] ${isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className={`p-4 border-t transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white/40'}`}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className={`max-w-3xl mx-auto flex items-center gap-2 rounded-xl p-1.5 border focus-within:shadow-md transition-all duration-300 ${isDarkMode ? 'bg-slate-800/60 border-slate-700/60 focus-within:border-emerald-500/70 focus-within:shadow-emerald-500/5' : 'bg-white border-slate-200 focus-within:border-emerald-500/70 focus-within:shadow-emerald-500/5'}`}
          >
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${BOT_NAME} anything, or request assistance...`}
              className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm px-3 placeholder-slate-400"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs transition-all active:scale-95"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* --- DRAGGABLE INTERACTIVE RESIZE HANDLE --- */}
      <div
        onMouseDown={startResizing}
        className={`hidden lg:block w-1 hover:w-1.5 cursor-col-resize select-none transition-all h-full ${isDrawerOpen ? '' : 'hidden'} ${isResizing ? 'bg-emerald-600' : (isDarkMode ? 'bg-slate-800 hover:bg-emerald-500 active:bg-emerald-600' : 'bg-slate-200 hover:bg-emerald-500 active:bg-emerald-600')}`}
        title="Drag to resize Study Toolkit"
      />

      {/* RIGHT DRAWER: Pomodoro & To-Do Checklist */}
      <aside 
        style={{ 
          width: isDrawerOpen ? `${drawerWidth}px` : '0px',
          transition: isResizing ? 'none' : 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}
        className={`fixed lg:relative inset-y-0 right-0 z-30 p-5 overflow-y-auto custom-scrollbar transition-all border-l ${isDarkMode ? 'bg-slate-950 border-slate-800 opacity-100' : 'bg-white border-slate-200 opacity-100'} ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 min-w-[200px]">
          <h2 className="text-xs font-bold flex items-center gap-2 truncate">
            ⚡ Productivity Toolkit
          </h2>
          <button onClick={() => { playPopSound(); setIsDrawerOpen(false); }} className={`lg:hidden text-slate-400 hover:text-white transition-colors`}>
            ✕
          </button>
        </div>

        {/* POMODORO TIMER */}
        <div className={`p-4 rounded-xl border mb-6 text-center shadow-inner min-w-[200px] transition-all duration-300 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} ${timerActive ? 'border-emerald-500/40 animate-pulse-glow' : ''}`}>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
            {isBreak ? "🌸 Break Mode" : "⏱️ Study Focus Timer"}
          </p>
          <div className={`text-2xl font-black tracking-widest py-1.5 transition-colors ${timerActive ? 'text-emerald-400' : (isDarkMode ? 'text-slate-100' : 'text-slate-800')}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <button 
              onClick={toggleTimer}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all active:scale-95 ${timerActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
            >
              {timerActive ? 'Pause' : 'Start Focus'}
            </button>
            <button 
              onClick={resetTimer}
              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* TO-DO CHECKLIST */}
        <div className="space-y-4 min-w-[200px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400">Daily Study Targets</h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold transition-all">
              {tasks.filter(t => t.completed).length}/{tasks.length} Done
            </span>
          </div>

          <form onSubmit={addTask} className="flex gap-1">
            <input 
              type="text"
              placeholder="Add a priority..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className={`flex-1 border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            />
            <button type="submit" className="bg-emerald-650 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold transition-all active:scale-90">+</button>
          </form>

          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <li 
                key={task.id}
                className={`flex items-center justify-between p-2 rounded border text-xs transition-all duration-300 ${isDarkMode ? 'bg-slate-900/50 border-slate-850 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <input 
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="accent-emerald-500 h-3.5 w-3.5 rounded cursor-pointer"
                  />
                  <span className={`truncate transition-all text-xs ${task.completed ? 'line-through text-slate-500' : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 font-bold px-1 transition-colors"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

    </div>
  );
}