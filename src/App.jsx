import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Trophy, 
  Download, 
  Clock, 
  Play, 
  Target, 
  CheckCircle2, 
  Keyboard,
  User,
  AlertCircle
} from 'lucide-react';

// --- DATA ---
const PROMPTS = [
  "The Amazon Rainforest is often called the lungs of the Earth because it produces a massive amount of the world's oxygen. It spans across several countries in South America and is home to millions of different plant and animal species. Exploring this dense jungle requires preparation, as the environment can be both beautiful and unforgiving. Scientists are still discovering new insects and medicines hidden deep within its canopy.",
  "In ancient Egypt, the Nile River was the center of life. It provided water for drinking, fertile soil for farming, and a highway for transportation. Every year, the river would flood, leaving behind rich, dark soil perfect for growing crops like wheat and flax. The Egyptians built incredible monuments, such as the pyramids and the Sphinx, which still stand today as a testament to their advanced engineering skills.",
  "Space exploration has always fascinated humanity. Our solar system contains eight planets, each with its own unique characteristics. Mars, known as the Red Planet, is currently the focus of many missions, as scientists hope to find signs of past microscopic life. Telescopes like the Hubble and James Webb allow us to peer deep into the universe, capturing breathtaking images of distant galaxies and glowing nebulas.",
  "Photosynthesis is the amazing process that plants use to make their own food. By taking in sunlight, carbon dioxide from the air, and water from the soil, plants can create glucose, a type of sugar they use for energy. During this process, they release oxygen back into the atmosphere, which is essential for humans and animals to breathe. It is a perfect cycle that sustains almost all life on our planet.",
  "The deep ocean is one of the most mysterious places on our planet. Because sunlight cannot reach these extreme depths, the water is pitch black and freezing cold. The creatures that live there, like the anglerfish and the giant squid, have adapted in bizarre ways to survive. Some even produce their own light through a process called bioluminescence to attract prey or communicate in the dark.",
  "Mount Everest is the highest mountain on Earth above sea level, located in the majestic Himalayas. Climbing this massive peak is a dangerous challenge that requires months of training and specialized equipment. Climbers must face freezing temperatures, fierce winds, and a lack of oxygen as they ascend. Despite the extreme risks, hundreds of adventurous people travel from all over the world every year to test their limits and try to reach the summit.",
  "The water cycle is the continuous movement of water all around our planet. It begins when the sun heats up oceans and lakes, causing water to evaporate into the air as a gas. As this invisible vapor rises, it cools and condenses into tiny droplets to form clouds. When these droplets become heavy enough, they fall back to the ground as rain or snow, providing the fresh water that plants and animals need to survive.",
  "The first Olympic Games were held in Ancient Greece over two thousand years ago in the city of Olympia. These athletic contests were organized to honor Zeus, the king of the Greek gods. Originally, the only event was a short foot race, but over time, they added wrestling, chariot racing, and the pentathlon. Today, the modern Olympics still bring athletes together from across the globe to promote peace and international friendship.",
  "Robots are incredible machines designed to carry out complex tasks automatically. While some robots are built to explore distant planets like Mars, others work in factories helping to build cars and electronics. Recently, engineers have been developing artificial intelligence, which allows computers to learn from data and make decisions. In the future, robots might help doctors perform surgeries, drive our cars, or even clean our homes while we relax.",
  "The Great Wall of China is one of the most impressive architectural wonders ever built by humans. It is not just one continuous wall, but a series of fortifications constructed by different Chinese emperors over many centuries. Made of stone, brick, and packed earth, it was originally designed to protect the empire from invading armies. Today, it winds its way across mountains and deserts, attracting millions of tourists who want to walk along its ancient paths.",
  "Volcanoes are fascinating and powerful natural features that can change the landscape of our planet in an instant. They form when hot, melted rock called magma rises from deep inside the Earth and escapes through a crack in the crust. When a volcano erupts, it can shoot out ash, toxic gases, and glowing red lava. Although eruptions can be incredibly dangerous, the ash they leave behind eventually turns into some of the richest farming soil in the world.",
  "During the Renaissance, Europe experienced a massive explosion of art, science, and new ideas. People began to rediscover the knowledge of the ancient Greeks and Romans, leading to incredible inventions and beautiful paintings. Leonardo da Vinci was one of the most famous figures of this time, known not only for painting the Mona Lisa but also for designing early flying machines. This period of history totally changed how humans viewed themselves and their place in the world.",
  "Renewable energy comes from natural sources that never run out, like the sun, wind, and flowing water. Unlike fossil fuels such as coal and oil, renewable sources do not produce harmful pollution that causes climate change. Solar panels capture energy from sunlight, while massive wind turbines use the breeze to spin and generate electricity. Transitioning to these clean energy sources is an important step in protecting our environment and keeping the air clean.",
  "The human brain is a supercomputer that controls everything you do, from breathing to solving complex math problems. It is made up of billions of tiny cells called neurons that send electrical signals back and forth at lightning speed. The brain works with the spinal cord to form the nervous system, which acts as a massive communication network for the entire body. Protecting your brain by wearing a helmet and getting enough sleep is essential for staying healthy and smart.",
  "Antarctica is the coldest, windiest, and driest continent on Earth, covered almost entirely by a thick sheet of ice. Even though it looks like a frozen wasteland, the surrounding ocean is teeming with life, including whales, seals, and krill. Emperor penguins are some of the most famous residents, capable of surviving the brutal winter by huddling together for warmth. Because of its harsh climate, no humans live there permanently, but scientists visit to study the weather and wildlife.",
  "The Industrial Revolution was a period of major change when people stopped making goods by hand and started using machines. Factories began to pop up in cities, powered by steam engines that burned coal. This allowed clothing, tools, and other products to be made much faster and cheaper than ever before. While it led to modern conveniences and the growth of cities, it also caused problems like terrible pollution and dangerous working conditions for early factory workers.",
  "Dinosaurs ruled the Earth for millions of years before going extinct long before the first humans ever appeared. Paleontologists study these incredible creatures by digging up their fossilized bones, footprints, and eggs. Some dinosaurs, like the Tyrannosaurus rex, were fierce predators with sharp teeth, while others, like the Brachiosaurus, were gentle giants that ate leaves from tall trees. Birds are actually the closest living relatives to these ancient reptiles today.",
  "The internet is a massive global network that connects billions of computers, phones, and other smart devices. It allows people to send emails, stream their favorite movies, and search for information in a matter of seconds. All of this data travels through invisible wireless signals and giant cables that stretch across the bottom of the ocean. While the internet is an amazing tool for learning and communication, it is also important to practice safe habits while browsing online.",
  "The Roman Empire was one of the largest and most powerful civilizations in ancient history. They were brilliant engineers who built massive stone aqueducts to carry fresh water into their bustling cities. The Romans also constructed incredible structures like the Colosseum, where thousands of people would gather to watch gladiators battle. Many modern languages, laws, and forms of government have their roots in the ancient Roman way of life.",
  "The International Space Station, or ISS, is a large spacecraft that orbits high above the Earth. It serves as a floating science laboratory where astronauts from different countries live and work together for months at a time. Because there is very little gravity, the astronauts float around the station and have to strap themselves to the walls when they sleep. The experiments they conduct in space help scientists develop new technologies and prepare for future missions to Mars."
];

const GOAL_MINUTES = 20;
const GOAL_SECONDS = GOAL_MINUTES * 60;
const INACTIVITY_DELAY_MS = 2000; // Stop timer after 2 seconds of no typing

export default function App() {
  // User & App State
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  
  // Typing State
  const [currentPromptIndex, setCurrentPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [typedText, setTypedText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Timer State
  const [totalActiveSeconds, setTotalActiveSeconds] = useState(0);
  const [promptActiveSeconds, setPromptActiveSeconds] = useState(0);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);
  
  // Stats & History
  const [history, setHistory] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [lastStats, setLastStats] = useState(null);

  // Refs
  const inputRef = useRef(null);
  const lastKeystrokeTime = useRef(0);
  const timerRef = useRef(null);
  const promptContainerRef = useRef(null);
  const typedTextRef = useRef('');

  const currentPrompt = PROMPTS[currentPromptIndex];

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!isStarted || showStatsModal) return;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const currentLen = typedTextRef.current.length;
      // If the last keystroke was within our inactivity window, count this second
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
    const value = e.target.value;
    if (value.length <= currentPrompt.length) {
      setTypedText(value);
      typedTextRef.current = value;
      lastKeystrokeTime.current = Date.now();
    }
  };

  // Check for prompt completion
  useEffect(() => {
    if (typedText.length === currentPrompt.length && currentPrompt.length > 0) {
      finishPrompt();
    }
  }, [typedText]);

  const finishPrompt = () => {
    // Calculate stats
    let correctChars = 0;
    for (let i = 0; i < currentPrompt.length; i++) {
      if (typedText[i] === currentPrompt[i]) correctChars++;
    }

    const accuracy = Math.round((correctChars / currentPrompt.length) * 100);
    const minutes = promptActiveSeconds / 60 || 1/60; // Prevent divide by zero
    // Standard WPM: (characters / 5) / minutes
    const wpm = Math.round((currentPrompt.length / 5) / minutes);

    const stats = {
      promptNumber: history.length + 1,
      wpm,
      accuracy,
      timeSeconds: promptActiveSeconds,
      date: new Date().toLocaleString()
    };

    setLastStats(stats);
    setHistory([...history, stats]);
    setShowStatsModal(true);
    setIsCurrentlyTyping(false);
  };

  const nextPrompt = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * PROMPTS.length);
    } while (nextIndex === currentPromptIndex && PROMPTS.length > 1);

    setCurrentPromptIndex(nextIndex);
    setTypedText('');
    typedTextRef.current = '';
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

  const downloadReport = () => {
    const avgWpm = history.length ? Math.round(history.reduce((sum, h) => sum + h.wpm, 0) / history.length) : 0;
    const avgAcc = history.length ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / history.length) : 0;

    let reportContent = `TYPING PRACTICE REPORT\n`;
    reportContent += `======================\n\n`;
    reportContent += `Student: ${studentName}\n`;
    reportContent += `Date: ${new Date().toLocaleDateString()}\n`;
    reportContent += `Total Active Typing Time: ${formatTime(totalActiveSeconds)}\n`;
    reportContent += `Goal Progress: ${Math.min(100, Math.round((totalActiveSeconds / GOAL_SECONDS) * 100))}% of ${GOAL_MINUTES} minutes\n\n`;
    reportContent += `OVERALL AVERAGES\n`;
    reportContent += `----------------\n`;
    reportContent += `Average WPM: ${avgWpm}\n`;
    reportContent += `Average Accuracy: ${avgAcc}%\n\n`;
    reportContent += `SESSION HISTORY\n`;
    reportContent += `---------------\n`;
    
    if (history.length === 0) {
      reportContent += `No prompts completed yet.\n`;
    } else {
      history.forEach((h, i) => {
        reportContent += `Prompt ${i + 1} - WPM: ${h.wpm} | Accuracy: ${h.accuracy}% | Time: ${formatTime(h.timeSeconds)}\n`;
      });
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, '_')}_Typing_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RENDERERS ---

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full inline-block mb-6">
            <Keyboard size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Typing Explorer</h1>
          <p className="text-slate-500 mb-8">Ready to boost your typing skills? Let's aim for 20 minutes of solid practice today!</p>
          
          <form onSubmit={(e) => { e.preventDefault(); if (studentName.trim()) setIsStarted(true); }} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Enter your first name..."
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={!studentName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg shadow-sm"
            >
              Start Typing <Play size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(100, (totalActiveSeconds / GOAL_SECONDS) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Keyboard size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">Typing Explorer</h1>
            <p className="text-sm text-slate-500">Student: {studentName}</p>
          </div>
        </div>

        <button
          onClick={downloadReport}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-lg transition-colors"
        >
          <Download size={18} />
          Download Report
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Progress Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target size={20} className="text-blue-500" /> 
                Daily Goal: 20 Minutes
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Time only counts while you are actively typing!
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono flex items-center justify-end gap-2">
                {isCurrentlyTyping && <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>}
                {!isCurrentlyTyping && <span className="w-3 h-3 bg-slate-300 rounded-full"></span>}
                {formatTime(totalActiveSeconds)}
              </div>
              <p className="text-xs text-slate-400">Active Typing Time</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
            <span>0 min</span>
            <span>10 min</span>
            <span className={progressPercent >= 100 ? 'text-green-500' : ''}>20 min</span>
          </div>
        </section>

        {/* Typing Interface */}
        <section 
          ref={promptContainerRef}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex-1 relative overflow-hidden group cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Hidden Input Layer */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={(e) => e.preventDefault()}
            className="absolute opacity-0 w-0 h-0 p-0 m-0 overflow-hidden"
            autoFocus
            spellCheck="false"
            autoComplete="off"
          />

          {/* Blur Overlay if not focused */}
          {!isFocused && !showStatsModal && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all">
              <div className="bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-lg animate-bounce">
                <AlertCircle size={20} />
                <span className="font-medium">Click here to start/resume typing</span>
              </div>
            </div>
          )}

          {/* Typing Text Display */}
          <div 
            className={`font-mono text-2xl leading-[2.5] tracking-wide transition-opacity ${!isFocused && !showStatsModal ? 'opacity-30' : 'opacity-100'}`}
            style={{ wordBreak: 'break-word' }}
          >
            {currentPrompt.split('').map((char, index) => {
              let colorClass = 'text-slate-400';
              let bgClass = 'bg-transparent';
              let isError = false;

              if (index < typedText.length) {
                if (typedText[index] === char) {
                  colorClass = 'text-emerald-600 font-semibold';
                } else {
                  colorClass = 'text-red-600 font-semibold';
                  bgClass = 'bg-red-100 rounded-sm';
                  isError = true;
                }
              }

              const isCursor = index === typedText.length && isFocused;
              const cursorClass = isCursor 
                ? 'border-l-2 border-blue-500 bg-blue-50 text-slate-800 animate-[pulse_1s_ease-in-out_infinite] -ml-[2px] pl-[2px]' 
                : '';

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

          <div className="mt-8 flex justify-between items-center text-sm text-slate-500 border-t border-slate-100 pt-4">
            <div className="flex gap-4">
              <span>Paragraph {history.length + 1}</span>
              <span>•</span>
              <span>{Math.round((typedText.length / currentPrompt.length) * 100)}% Complete</span>
            </div>
            <button 
              onClick={() => {
                setTypedText('');
                typedTextRef.current = '';
                setPromptActiveSeconds(0);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              Restart Paragraph
            </button>
          </div>
        </section>
      </main>

      {/* Stats Modal */}
      {showStatsModal && lastStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Great Job!</h2>
              <p className="text-slate-500">You completed the paragraph.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <div className="text-3xl font-black text-blue-600 mb-1">{lastStats.wpm}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WPM</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                <div className="text-3xl font-black text-emerald-600 mb-1">{lastStats.accuracy}%</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accuracy</div>
              </div>
            </div>

            <button
              onClick={nextPrompt}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              Next Paragraph <CheckCircle2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}