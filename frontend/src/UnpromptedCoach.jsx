import React, { useState, useRef, useEffect } from 'react';
import { useSpeechSession } from './useSpeechSession';

const GENERAL_NICHES = [
  { id: 'General', icon: '✦', topics: ['Brainrot', 'Nostalgia', 'Muscle Memory', 'Comfort Zone', 'Waiting Room'] },
  { id: 'Personal finance', icon: '💰', topics: ['Budgeting', 'Investing', 'Taxes', 'Credit cards', 'Retirement'] },
  { id: 'Entrepreneurship', icon: '🚀', topics: ['Bootstrapping', 'Venture capital', 'Scaling', 'Hiring', 'Marketing'] },
  { id: 'Startups', icon: '🌱', topics: ['Founder mode', 'Product-market fit', 'Burn rate', 'Zero to one', 'Pivot'] },
  { id: 'Tech / AI', icon: '🤖', topics: ['Hallucination', 'Agentic workflow', 'Context window', 'Black box', 'Prompt engineering'] },
  { id: 'Fitness', icon: '💪', topics: ['Hypertrophy', 'Cardio', 'Diet', 'Recovery', 'Supplements'] },
  { id: 'Nutrition', icon: '🥗', topics: ['Macros', 'Micros', 'Fasting', 'Keto', 'Vegan'] },
  { id: 'Productivity', icon: '⚡', topics: ['Pomodoro', 'Time blocking', 'Deep work', 'Habits', 'Focus'] },
  { id: 'History', icon: '📜', topics: ['Roman Empire', 'World War II', 'Industrial Revolution', 'Cold War', 'Renaissance'] },
  { id: 'Literature', icon: '📚', topics: ['Classics', 'Sci-Fi', 'Fantasy', 'Poetry', 'Non-fiction'] }
];

const INTERVIEW_NICHES = [
  { id: 'Cloud', icon: '☁️', topics: ['Serverless vs Containers', 'Designing High Availability', 'AWS S3 Consistency Model', 'Explain VPCs'] },
  { id: 'DevOps', icon: '⚙️', topics: ['CI/CD Pipeline Design', 'Handling Production Outages', 'Infrastructure as Code', 'Kubernetes Architecture'] },
  { id: 'Full Stack', icon: '💻', topics: ['SQL vs NoSQL', 'React State Management', 'REST vs GraphQL', 'Event Loop in Node.js'] }
];

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export default function UnpromptedCoach() {
  const [contextMode, setContextMode] = useState('general');
  const [niche, setNiche] = useState(GENERAL_NICHES[0].id);
  const [topic, setTopic] = useState(GENERAL_NICHES[0].topics[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [enableAiReview, setEnableAiReview] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const videoRef = useRef(null);

  const activeNiches = contextMode === 'general' ? GENERAL_NICHES : INTERVIEW_NICHES;

  const {
    sessionState,
    timeRemaining,
    videoStream,
    recordedUrl,
    aiFeedback,
    sessionError,
    setSessionError,
    startRecording,
    stopRecording,
    resetSession
  } = useSpeechSession({ speechDuration: 60 });

  // Attach live camera stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream || null;
    }
  }, [videoStream]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const spinTopic = () => {
    setIsSpinning(true);
    let count = 0;
    const selectedNicheObj = activeNiches.find(n => n.id === niche) || activeNiches[0];
    const pool = selectedNicheObj.topics;
    const interval = setInterval(() => {
      setTopic(pool[Math.floor(Math.random() * pool.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 80);
  };

  const selectedNicheObj = activeNiches.find(n => n.id === niche) || activeNiches[0];
  const elapsed = 60 - timeRemaining;
  const stage = elapsed < 20 ? 0 : elapsed < 40 ? 1 : 2;

  return (
    <div className="page">
      <div className="atmosphere" />
      
      {/* Header */}
      <header className="brand">
        <h1 className="brand-mark">Unprompted</h1>
        <div className="brand-credit">
          made by 
          <span className="credit-pill">
            <InstagramIcon /> @praveenkashyap.10
          </span>
        </div>
      </header>

      {/* Main Stage */}
      <main className="stage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Mode Selector */}
        <div className="mode-selector">
          <button 
            className={`mode-btn ${contextMode === 'general' ? 'active' : ''}`}
            onClick={() => { setContextMode('general'); setNiche(GENERAL_NICHES[0].id); }}
            disabled={sessionState !== 'idle'}
          >
            🧠 General Topics
          </button>
          <button 
            className={`mode-btn ${contextMode === 'interview' ? 'active' : ''}`}
            onClick={() => { setContextMode('interview'); setNiche(INTERVIEW_NICHES[0].id); }}
            disabled={sessionState !== 'idle'}
          >
            💼 Tech Interview
          </button>
        </div>
        <p className="mode-desc">
          {contextMode === 'general' ? 'Minimal prep. Try to think quick on your feet.' : 'Test your technical depth and articulation.'}
        </p>

        {/* Niche Dropdown Custom */}
        <div className="niche-selector" ref={dropdownRef}>
          <div className="niche-dropdown-container">
            <button 
              className="niche-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={sessionState !== 'idle'}
            >
              <span className="niche-icon">{selectedNicheObj.icon}</span>
              <span className="niche-label">{selectedNicheObj.id}</span>
              <span className="niche-caret">{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            
            {isDropdownOpen && (
              <div className="niche-dropdown-menu-wrapper">
                <div className="niche-dropdown-scroll">
                  {activeNiches.map(n => (
                    <button 
                      key={n.id} 
                      className="niche-dropdown-item" 
                      onClick={() => { setNiche(n.id); setIsDropdownOpen(false); }}
                    >
                      <span className="niche-icon">{n.icon}</span>
                      <span>{n.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reel */}
        <section className={`reel ${isSpinning ? 'is-spinning' : ''}`}>
          <p className="reel-eyebrow">READY</p>
          <p className="reel-phrase">{topic}</p>
        </section>

        {/* Actions */}
        <div className="actions">
          <button className="btn primary" onClick={spinTopic} disabled={isSpinning || sessionState !== 'idle'}>
            {isSpinning ? 'Spinning…' : 'Spin'}
          </button>
          <button className="btn secondary" onClick={() => startRecording(topic, enableAiReview, contextMode)} disabled={isSpinning || sessionState !== 'idle'}>
            Start 1 min timer
          </button>
          <button 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'rgba(244, 232, 214, 0.6)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.5rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#f4e8d6'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(244, 232, 214, 0.6)'}
            onClick={() => setShowSettings(true)}
            disabled={sessionState !== 'idle'}
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={e => e.stopPropagation()}>
            <div className="settings-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Enable AI Review</span>
                <span className="setting-desc">Get automated feedback on your speech delivery.</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={enableAiReview} 
                  onChange={(e) => setEnableAiReview(e.target.checked)} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera & Recording Overlay */}
      {sessionState === 'recording' && (
        <div className="timer-overlay is-live">
          <div className="timer-overlay-inner">
            <p className="timer-topic">{topic}</p>

            {/* Speaking Stages */}
            <ol className="speech-stages">
              {['What?', 'So what?', 'Now what?'].map((label, idx) => (
                <li key={label} className={`speech-stage ${idx <= stage ? 'is-hit' : ''}`}>
                  <span>{label}</span>
                </li>
              ))}
            </ol>

            {/* Camera Frame with Timer Ring */}
            <div className="camera-container" style={{ position: 'relative', width: 340, height: 340, borderRadius: '50%', overflow: 'hidden', margin: '0 auto' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              />
              <div 
                className="timer-ring-overlay" 
                style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  boxShadow: 'inset 0 0 0 6px var(--accent)'
                }}
              />
              <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                <span className="timer-digits" style={{ fontSize: '2.5rem', background: 'rgba(17,21,20,0.6)', padding: '4px 16px', borderRadius: 999 }}>
                  0:{timeRemaining.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <p className="timer-status">Speak now on "{topic}"</p>
            <button className="btn primary" onClick={stopRecording}>Finish Speaking Early</button>
          </div>
        </div>
      )}

      {/* AI Processing Screen */}
      {sessionState === 'processing' && (
        <div className="timer-overlay">
          <div className="timer-overlay-inner">
            <p className="timer-status">Analyzing your speech delivery with AI…</p>
          </div>
        </div>
      )}

      {/* Review Modal (With or Without AI Feedback) */}
      {sessionState === 'review' && (
        <div className="timer-overlay" style={{ overflowY: 'auto' }}>
          <div className="timer-overlay-inner" style={{ maxWidth: 680, textAlign: 'left', marginTop: 'auto', marginBottom: 'auto', padding: '2rem 0' }}>
            <h2 className="brand-mark" style={{ fontSize: '2.5rem' }}>
              {aiFeedback?.overallScore ? 'AI Speech Feedback' : 'Speech Review'}
            </h2>
            <p className="timer-topic" style={{ fontSize: '1.2rem', fontWeight: 400 }}>Topic: {topic}</p>

            {aiFeedback?.overallScore && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', margin: '1.5rem 0' }}>
                <div className="speech-stage" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '1px' }}>OVERALL SCORE</span>
                  <strong style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{aiFeedback.overallScore} <span style={{fontSize:'1rem', color:'rgba(244, 232, 214, 0.5)'}}>/ 100</span></strong>
                </div>
                <div className="speech-stage" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '1px' }}>PACING (WPM)</span>
                  <strong style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{aiFeedback.wordsPerMinute} <span style={{fontSize:'1rem', color:'rgba(244, 232, 214, 0.5)'}}>WPM</span></strong>
                </div>
              </div>
            )}

            {/* Video Playback & Download Button */}
            {recordedUrl && (
              <div style={{ margin: aiFeedback?.overallScore ? '0' : '2rem 0' }}>
                <video src={recordedUrl} controls style={{ width: '100%', borderRadius: '1rem', maxHeight: 300, background: '#000' }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <a href={recordedUrl} download="unprompted_speech.webm" className="btn secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    ⬇ Download Recording
                  </a>
                </div>
              </div>
            )}

            {/* Verbatim Transcript */}
            {aiFeedback?.transcript && (
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ color: 'var(--text)', margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Your Transcript</h4>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(244, 232, 214, 0.8)', fontStyle: 'italic' }}>
                  "{aiFeedback.transcript}"
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            {aiFeedback?.overallScore && (
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ color: '#b7efc5', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Strengths</h4>
                  <ul>{aiFeedback.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent-bright)', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Areas to Improve</h4>
                  <ul>{aiFeedback.areasToImprove?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              </div>
            )}

            <button className="btn primary" onClick={resetSession} style={{ marginTop: '2rem', width: '100%' }}>
              Practice Another Topic
            </button>
          </div>
        </div>
      )}

      {/* Error/Warning Custom Modal */}
      {sessionError && (
        <div className="settings-modal-overlay" onClick={() => setSessionError(null)} style={{ zIndex: 9999 }}>
          <div className="settings-modal" onClick={e => e.stopPropagation()} style={{ border: '1px solid var(--accent)', maxWidth: 450 }}>
            <div className="settings-header" style={{ marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>Notice</h3>
              <button className="close-btn" onClick={() => setSessionError(null)}>×</button>
            </div>
            <p style={{ color: 'rgba(244, 232, 214, 0.9)', lineHeight: '1.6', fontSize: '1rem', margin: 0 }}>
              {sessionError}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn primary" onClick={() => setSessionError(null)} style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
