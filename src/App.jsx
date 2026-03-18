import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Trophy, 
  Download, 
  Clock, 
  Play, 
  Target, 
  CheckCircle2, 
  Keyboard,
  User,
  AlertCircle,
  Cloud,
  RefreshCw
} from 'lucide-react';

// --- FIREBASE SETUP ---
const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
let app, auth, db;
let isFirebaseEnabled = false;

// Initialize Firebase if we are in the Canvas preview, OR if the user provides their config
if (configStr) {
  const firebaseConfig = JSON.parse(configStr);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseEnabled = true;
} else {
  // To enable Auto-Save on Netlify, replace these placeholders with your free Firebase project keys!
  // Note: If using Vite locally with a .env file, you can change these to use import.meta.env.VITE_FIREBASE_API_KEY etc.
  const externalConfig = {
  apiKey: "AIzaSyCw51R2h99aDQQJo7cmqFgF80rCGpX_6nc",
  authDomain: "typing-practice-30e0d.firebaseapp.com",
  projectId: "typing-practice-30e0d",
  storageBucket: "typing-practice-30e0d.firebasestorage.app",
  messagingSenderId: "938274814431",
  appId: "1:938274814431:web:c57806b0360347f847ac6a",
  measurementId: "G-3V797RQZY3"
  };
  
  if (externalConfig.apiKey !== "YOUR_API_KEY" && externalConfig.apiKey !== undefined) {
    app = initializeApp(externalConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = true;
  }
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'typing-practice-app';

// --- DATA ---
// We removed the hardcoded PROMPTS array so it can be fetched from a file
const FALLBACK_PROMPTS = [
  "The Amazon Rainforest is often called the lungs of the Earth because it produces a massive amount of the world's oxygen. It spans across several countries in South America and is home to millions of different plant and animal species. Exploring this dense jungle requires preparation, as the environment can be both beautiful and unforgiving. Scientists are still discovering new insects and medicines hidden deep within its canopy.",
  "In ancient Egypt, the Nile River was the center of life. It provided water for drinking, fertile soil for farming, and a highway for transportation. Every year, the river would flood, leaving behind rich, dark soil perfect for growing crops like wheat and flax. The Egyptians built incredible monuments, such as the pyramids and the Sphinx, which still stand today as a testament to their advanced engineering skills."
];

const GOAL_MINUTES = 20;
const INACTIVITY_DELAY_MS = 2000;

export default function App() {
  // User & App State
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  
  // Firebase User & Save State
  const [user, setUser] = useState(null);
  const [isRestoring, setIsRestoring] = useState(isFirebaseEnabled);
  const [saveStatus, setSaveStatus] = useState(''); 
  
  // Typing State
  const [prompts, setPrompts] = useState([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Timer State
  const [totalActiveSeconds, setTotalActiveSeconds] = useState(0);
  const [promptActiveSeconds, setPromptActiveSeconds] = useState(0);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);
  
  // Stats & Progress State
  const [history, setHistory] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [lastStats, setLastStats] = useState(null);

  // Refs
  const inputRef = useRef(null);
  const lastKeystrokeTime = useRef(0);
  const timerRef = useRef(null);
  const promptContainerRef = useRef(null);
  const typedTextRef = useRef('');

  const currentPrompt = prompts.length > 0 ? prompts[currentPromptIndex % prompts.length] : "Loading prompts...";

  // --- EXTERNAL PROMPTS LOGIC ---
  useEffect(() => {
    // Fetch prompts from the external text file.
    // TIP: To update without redeploying, change this URL to a raw GitHub Gist or JSONBin URL!
    fetch('https://gist.githubusercontent.com/brmiller-cmyk/e5cc5687068bbf0820cc7853b009ddb1/raw/c47da09d2b731a1cc3e6e2a1c1cf626c459a3d7f/prompts.json')
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPrompts(data);
          setCurrentPromptIndex(Math.floor(Math.random() * data.length));
        } else {
          setPrompts(FALLBACK_PROMPTS);
        }
      })
      .catch(err => {
        console.warn("Could not load prompts.json, using fallback prompts.", err);
        setPrompts(FALLBACK_PROMPTS);
      });
  }, []);

  // --- FIREBASE AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!isFirebaseEnabled || !auth) {
      setIsRestoring(false);
      return;
    }
    
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error", e);
        setIsRestoring(false);
      }
    };
    
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsRestoring(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db || !isFirebaseEnabled) return;
    
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'saves', 'progress');
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists() && !isStarted) {
        const data = docSnap.data();
        const today = new Date().toLocaleDateString();

        if (data.studentName) setStudentName(data.studentName);

        // DAILY RESET LOGIC: Only restore typing progress if they saved it today
        if (data.lastActiveDate === today) {
          if (data.totalActiveSeconds) setTotalActiveSeconds(data.totalActiveSeconds);
          if (data.history) setHistory(data.history);
          if (data.currentPromptIndex !== undefined) setCurrentPromptIndex(data.currentPromptIndex);
          if (data.promptActiveSeconds) setPromptActiveSeconds(data.promptActiveSeconds);
          if (data.typedText) {
            setTypedText(data.typedText);
            typedTextRef.current = data.typedText;
          }
        }

        if (data.isStarted) setIsStarted(true);
      }
      setIsRestoring(false);
    }, (err) => {
      console.error("Load error:", err);
      setIsRestoring(false);
    });

    return () => unsubscribe();
  }, [user, isStarted]);

  useEffect(() => {
    if (!user || !db || !isFirebaseEnabled || isRestoring || !studentName) return;

    const saveProgress = async () => {
      setSaveStatus('Saving...');
      try {
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'saves', 'progress');
        await setDoc(userRef, {
          studentName,
          isStarted,
          totalActiveSeconds,
          promptActiveSeconds,
          typedText,
          history,
          currentPromptIndex,
          lastSaved: new Date().toISOString(),
          lastActiveDate: new Date().toLocaleDateString() // Used for daily reset check
        }, { merge: true });
        
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatus('');
      }
    };

    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, studentName, isStarted, totalActiveSeconds, promptActiveSeconds, typedText, history, currentPromptIndex, isRestoring]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!isStarted || showStatsModal) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const currentLen = typedTextRef.current.length;
      
      if (now - lastKeystrokeTime.current < INACTIVITY_DELAY_MS && currentLen > 0 && currentLen < currentPrompt.length) {
        setTotalActiveSeconds(prev => prev + 1);
        setPromptActiveSeconds(prev => prev + 1);
        setIsCurrentlyTyping(true);
      } else {
        setIsCurrentlyTyping(false);
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isStarted, showStatsModal, currentPrompt.length]);

  // --- TYPING HANDLERS ---
  const handleInputChange = (e) => {
    // BUG FIX: Strip out line breaks to prevent letter tracking offset
    const value = e.target.value.replace(/[\r\n]+/g, '');
    
    if (value.length <= currentPrompt.length) {
      setTypedText(value);
      typedTextRef.current = value;
      lastKeystrokeTime.current = Date.now();
    }
  };

  const handleKeyDown = (e) => {
    // BUG FIX: Prevent Enter key and Arrow keys from messing up the hidden cursor
    if (e.key === 'Enter' || e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  };

  const forceCursorToEnd = (e) => {
    // BUG FIX: If they click the text area, force the cursor to the end of the text
    const len = typedTextRef.current.length;
    e.target.setSelectionRange(len, len);
  };

  // Check for prompt completion
  useEffect(() => {
    if (typedText.length === currentPrompt.length && currentPrompt.length > 0 && !showStatsModal) {
      finishPrompt();
    }
  }, [typedText, currentPrompt.length, showStatsModal]);

  const finishPrompt = () => {
    let correctChars = 0;
    for (let i = 0; i < currentPrompt.length; i++) {
      if (typedText[i] === currentPrompt[i]) {
        correctChars++;
      }
    }

    const accuracy = Math.round((correctChars / currentPrompt.length) * 100);
    const minutesActive = promptActiveSeconds / 60;
    const wordsTyped = currentPrompt.length / 5;
    
    let wpm = 0;
    if (minutesActive > 0) {
      wpm = Math.round(wordsTyped / minutesActive);
    }

    const stats = { accuracy, wpm, timeSeconds: promptActiveSeconds };
    setLastStats(stats);
    setHistory([...history, stats]);
    setShowStatsModal(true);
    setIsCurrentlyTyping(false);
  };

  const nextPrompt = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * prompts.length);
    } while (nextIndex === currentPromptIndex && prompts.length > 1);

    setCurrentPromptIndex(nextIndex);
    setTypedText('');
    typedTextRef.current = '';
    if (inputRef.current) inputRef.current.value = ''; // Hard clear the DOM
    setPromptActiveSeconds(0);
    setShowStatsModal(false);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // --- HELPER FUNCTIONS ---
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSessionWPM = () => {
    if (history.length === 0) return 0;
    const totalWpm = history.reduce((sum, item) => sum + item.wpm, 0);
    return Math.round(totalWpm / history.length);
  };

  const getSessionAccuracy = () => {
    if (history.length === 0) return 0;
    const totalAcc = history.reduce((sum, item) => sum + item.accuracy, 0);
    return Math.round(totalAcc / history.length);
  };

  const handleExportData = () => {
    const data = {
      studentName,
      date: new Date().toLocaleDateString(),
      totalActiveMinutes: (totalActiveSeconds / 60).toFixed(1),
      paragraphsCompleted: history.length,
      averageWPM: getSessionWPM(),
      averageAccuracy: getSessionAccuracy(),
      sessionHistory: history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, '_')}_Typing_Data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to permanently reset today's progress?")) {
      setTotalActiveSeconds(0);
      setPromptActiveSeconds(0);
      setHistory([]);
      setTypedText('');
      typedTextRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
      if (prompts.length > 0) {
        setCurrentPromptIndex(Math.floor(Math.random() * prompts.length));
      }
    }
  };

  // --- RENDERERS ---
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-slate-500 font-medium flex items-center gap-3">
          <span className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-xl">Restoring your progress...</span>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-slate-100">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Keyboard size={32} />
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Typing Practice</h1>
          <p className="text-center text-slate-500 mb-8">Ready to reach your 20-minute daily goal?</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your first and last name..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && studentName.trim()) {
                      setIsStarted(true);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }
                  }}
                />
              </div>
            </div>
            <button 
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2
                ${studentName.trim() ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}`}
              onClick={() => {
                if (studentName.trim()) {
                  setIsStarted(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
              disabled={!studentName.trim()}
            >
              <Play size={18} /> Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200 text-slate-800">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Keyboard size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Typing Practice</h1>
              <p className="text-xs text-slate-500 font-medium">{studentName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-slate-100 px-3 sm:px-4 py-2 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isCurrentlyTyping ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <Clock size={16} className="text-slate-500 hidden sm:block" />
              <span className="font-mono font-semibold text-slate-700 tracking-wide">
                {formatTime(totalActiveSeconds)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetProgress}
                title="Reset Today's Progress"
                className="flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors bg-white border border-slate-200 hover:border-red-200 w-10 h-10 rounded-lg"
              >
                <RefreshCw size={16} />
              </button>

              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-white border border-slate-200 hover:border-blue-200 px-3 sm:px-4 py-2 rounded-lg h-10"
              >
                <Download size={16} className="hidden sm:block" /> Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Progress Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target size={20} className="text-blue-500" /> 
                Daily Goal: 20 Minutes
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-slate-500">
                  Time only counts while you are actively typing!
                </p>
                {saveStatus && (
                  <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Cloud size={12} /> {saveStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-blue-600">{Math.floor(totalActiveSeconds / 60)}</span>
              <span className="text-slate-500 font-medium ml-1">/ {GOAL_MINUTES} min</span>
            </div>
          </div>
          
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (totalActiveSeconds / (GOAL_MINUTES * 60)) * 100)}%` }}
            ></div>
          </div>
        </section>

        {/* Typing Area */}
        <section 
          className={`flex-1 bg-white rounded-2xl shadow-sm border p-8 relative flex flex-col transition-colors
            ${isFocused ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'}
            ${showStatsModal ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Hidden Textarea */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSelect={forceCursorToEnd}
            onClick={forceCursorToEnd}
            className="absolute inset-0 w-full h-full opacity-0 cursor-default resize-none z-10"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            disabled={showStatsModal}
          />

          {!isFocused && !showStatsModal && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl">
              <div className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl flex items-center gap-3 animate-bounce">
                <Keyboard size={20} /> Click here to start typing
              </div>
            </div>
          )}

          <div 
            ref={promptContainerRef}
            className="text-2xl leading-relaxed font-mono tracking-wide text-slate-400 select-none"
          >
            {currentPrompt.split('').map((char, index) => {
              let colorClass = '';
              let bgClass = '';
              let cursorClass = '';
              const isCursor = index === typedText.length;
              const isError = index < typedText.length && typedText[index] !== char;

              if (index < typedText.length) {
                if (typedText[index] === char) {
                  colorClass = 'text-slate-800'; // Correctly typed
                } else {
                  colorClass = 'text-red-500'; // Incorrectly typed
                  bgClass = 'bg-red-100 rounded-sm';
                }
              }

              if (isCursor && isFocused) {
                cursorClass = 'relative before:absolute before:left-0 before:-top-1 before:-bottom-1 before:w-[2px] before:bg-blue-500 before:animate-pulse';
              }

              // Ensure spaces are visible when they are errors or the cursor is on them
              const displayChar = char === ' ' && (isError || isCursor) ? '\u00A0' : char;

              return (
                <span 
                  key={index} 
                  className={`transition-colors ${colorClass} ${bgClass} ${cursorClass}`}
                >
                  {displayChar}
                </span>
              );
            })}
          </div>

          <div className="mt-auto pt-8 flex justify-between items-center text-sm text-slate-500 border-t border-slate-100">
            <div className="flex gap-4">
              <span>Paragraph {history.length + 1}</span>
              <span>•</span>
              <span>{Math.round((typedText.length / currentPrompt.length) * 100)}% Complete</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent focusing the main area
                setTypedText('');
                typedTextRef.current = '';
                if (inputRef.current) inputRef.current.value = ''; // BUG FIX: Hard clear the DOM element
                setPromptActiveSeconds(0);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors relative z-30"
            >
              Restart Paragraph
            </button>
          </div>
        </section>

        {/* Dashboard/Stats */}
        {history.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-around">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-medium mb-1">Session Avg WPM</p>
              <p className="text-2xl font-bold text-slate-800">{getSessionWPM()}</p>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 font-medium mb-1">Session Accuracy</p>
              <p className="text-2xl font-bold text-slate-800">{getSessionAccuracy()}%</p>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-sm text-slate-500 font-medium mb-1">Paragraphs Done</p>
              <p className="text-2xl font-bold text-slate-800">{history.length}</p>
            </div>
          </section>
        )}
      </main>

      {/* Completion Modal */}
      {showStatsModal && lastStats && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 transform transition-all scale-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trophy size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Paragraph Complete!</h2>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-slate-500 font-medium">Speed</span>
                <span className="text-xl font-bold text-slate-800">{lastStats.wpm} WPM</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                <span className="text-slate-500 font-medium">Accuracy</span>
                <span className="text-xl font-bold text-slate-800">{lastStats.accuracy}%</span>
              </div>
            </div>

            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              onClick={nextPrompt}
            >
              Next Paragraph <Play size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}