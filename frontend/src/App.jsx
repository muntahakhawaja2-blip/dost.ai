import React, { useState, useEffect, useRef } from 'react';
// --- BRANDING CONFIGURATION ---
const BOT_NAME = "DOST AI"; 
const BOT_SLOGAN = "Your Socratic Guide to Smarter Studying.";
// ------------------------------
export default function App() {
  // Sidebar & Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true); // Right drawer for widgets

  // --- DRAG-TO-RESIZE PRODUCTIVITY TOOLKIT ---
  const [drawerWidth, setDrawerWidth] = useState(320); // Default width is 320px
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault(); // Prevents awkward text highlighting while dragging
  };

  useEffect(() => {
    const handleMouseMove = (mouseMoveEvent) => {
      if (!isResizing) return;
      
      // Calculate new width relative to the right edge of the browser window
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      
      // Limit the drag boundaries so it doesn't get too small or too huge
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
      title: "Introduction Session",
      messages: [
        { id: 1, sender: 'bot', text: "Hey! I'm DostAI—your virtual study partner. Ready to tackle some tasks or learn a cool new topic? Ask me anything!" }
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
      if (!isBreak) {
        alert("Great job! Time for a well-deserved 5-minute break.");
        setTimeLeft(5 * 60);
        setIsBreak(true);
      } else {
        alert("Break is over! Time to focus for another 25 minutes.");
        setTimeLeft(25 * 60);
        setIsBreak(false);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, isBreak]);

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
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
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: `New Chat ${chats.length + 1}`,
      messages: [{ id: 1, sender: 'bot', text: "Hey! What are we working on or chatting about next? I'm ready when you are." }]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newId);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR: Chat History */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-950 border-r border-slate-800 transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full hidden md:flex flex-col'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold tracking-wider text-indigo-400 flex items-center gap-2">
              <span className="text-2xl">🧠</span> DostAI
            </span>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <button 
            onClick={createNewChat}
            className="w-full py-3 px-4 mb-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
          >
            ➕ New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Conversations</p>
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-150 truncate block ${chat.id === activeChatId ? 'bg-indigo-950/50 text-indigo-300 border border-indigo-800/50' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
              >
                💬 {chat.title}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex flex-col gap-1">
            <p>🌍 Eng, Urdu, & Hinglish supported</p>
            <p>© 2026 DostAI Mentor</p>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-900">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
              ☰
            </button>
            <h1 className="font-semibold text-slate-200 truncate max-w-xs md:max-w-md">
              {getActiveChat()?.title}
            </h1>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="px-4 py-2 text-xs md:text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition duration-150 flex items-center gap-2"
          >
            ⏱️ Study Toolkit {isDrawerOpen ? '→' : '←'}
          </button>
        </header>

        {/* CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {getActiveChat()?.messages.length <= 1 && (
            <div className="max-w-2xl mx-auto space-y-4 py-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-200">What shall we conquer today?</h2>
                <p className="text-sm text-slate-400">Choose an action template to instantly kick off our session.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <button 
                  onClick={() => handleTemplateClick("Let's build a productive Study Planner for my upcoming exams.")}
                  className="p-4 bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl text-left transition duration-200"
                >
                  <span className="text-lg">📅</span>
                  <h3 className="font-semibold text-slate-200 mt-2">Study Planner</h3>
                  <p className="text-xs text-slate-400 mt-1">Organize study targets for tough exam schedules.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Can you explain a complex academic concept with a simple analogy?")}
                  className="p-4 bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl text-left transition duration-200"
                >
                  <span className="text-lg">💡</span>
                  <h3 className="font-semibold text-slate-200 mt-2">Concept Explainer</h3>
                  <p className="text-xs text-slate-400 mt-1">Socratic help to digest tough scientific or math theories.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Let's plan a simple Daily To-Do List to organize my chaos today.")}
                  className="p-4 bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl text-left transition duration-200"
                >
                  <span className="text-lg">✔️</span>
                  <h3 className="font-semibold text-slate-200 mt-2">Daily To-Do List</h3>
                  <p className="text-xs text-slate-400 mt-1">Structure habits and routine productivity checks.</p>
                </button>

                <button 
                  onClick={() => handleTemplateClick("Give me a quick 3-question quiz on a random subject to test my knowledge!")}
                  className="p-4 bg-slate-800/50 hover:bg-indigo-950/30 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl text-left transition duration-200"
                >
                  <span className="text-lg">⚡</span>
                  <h3 className="font-semibold text-slate-200 mt-2">Quick Quiz</h3>
                  <p className="text-xs text-slate-400 mt-1">Test your recall on major core concepts.</p>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {getActiveChat()?.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md leading-relaxed text-sm md:text-base ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800/80 text-slate-100 rounded-bl-none border border-slate-700/50'}`}>
                  {msg.sender === 'bot' && (
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <span>🤖 DostAI</span>
                    </div>
                  )}
                  <span className="whitespace-pre-line">{msg.text}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none p-4 max-w-[85%] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="max-w-3xl mx-auto flex items-center gap-2 bg-slate-800/60 rounded-xl p-2 border border-slate-700/60 focus-within:border-indigo-500/70 transition"
          >
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything, or clear up an academic topic (Eng/Urdu)..."
              className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm md:text-base px-3 placeholder-slate-400"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* --- DRAGGABLE INTERACTIVE RESIZE HANDLE (Desktop only) --- */}
      <div
        onMouseDown={startResizing}
        className={`hidden lg:block w-1 hover:w-1.5 cursor-col-resize bg-slate-800 hover:bg-indigo-500 active:bg-indigo-600 select-none transition-all h-full ${isDrawerOpen ? '' : 'hidden'}`}
        title="Drag to resize Study Toolkit"
      />

      {/* RIGHT DRAWER: Pomodoro & To-Do Checklist */}
      <aside 
        style={{ width: isDrawerOpen ? `${drawerWidth}px` : '0px' }}
        className={`fixed lg:relative inset-y-0 right-0 z-30 bg-slate-950 border-l border-slate-800 p-5 transform transition-all duration-150 overflow-y-auto custom-scrollbar ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 min-w-[200px]">
          <h2 className="text-md font-bold text-slate-200 flex items-center gap-2 truncate">
            ⚡ Productivity Toolkit
          </h2>
          <button onClick={() => setIsDrawerOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* POMODORO TIMER */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6 text-center shadow-inner min-w-[200px]">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            {isBreak ? "🌸 Break Mode" : "⏱️ Study Focus Timer"}
          </p>
          <div className="text-3xl font-black text-slate-100 tracking-widest py-2">
            {formatTime(timeLeft)}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <button 
              onClick={toggleTimer}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${timerActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
            >
              {timerActive ? 'Pause' : 'Start Focus'}
            </button>
            <button 
              onClick={resetTimer}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition"
            >
              Reset
            </button>
          </div>
        </div>

        {/* TO-DO CHECKLIST */}
        <div className="space-y-4 min-w-[200px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Daily Study Targets</h3>
            <span className="text-xs bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              {tasks.filter(t => t.completed).length}/{tasks.length} Done
            </span>
          </div>

          <form onSubmit={addTask} className="flex gap-1">
            <input 
              type="text"
              placeholder="Add a priority..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold">+</button>
          </form>

          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {tasks.map((task) => (
              <li 
                key={task.id}
                className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800 text-xs transition-all duration-150"
              >
                <div className="flex items-center gap-2 truncate">
                  <input 
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="accent-indigo-500 h-3.5 w-3.5 rounded cursor-pointer"
                  />
                  <span className={`truncate text-slate-300 ${task.completed ? 'line-through text-slate-500' : ''}`}>
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 font-bold px-1"
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