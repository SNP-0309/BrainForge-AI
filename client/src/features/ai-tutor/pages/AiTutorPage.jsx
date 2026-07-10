import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../config/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useToastStore } from '../../../store/toastStore';
import { Send, Sparkles, Brain, AlertTriangle, MessageSquare, BookOpen, RefreshCw } from 'lucide-react';

const quickPrompts = [
  { label: 'Explain my active roadmap topic simply', text: 'Can you look at my active learning path and explain the current topic I should focus on in simple terms with an analogy?' },
  { label: 'Give a real-world coding analogy', text: 'Give me a real-world, intuitive analogy to explain how databases and API requests connect in software systems.' },
  { label: 'Create a study cheat sheet', text: 'Create a markdown study sheet summarizing the core concepts of Python Object Oriented Programming (OOP).' },
  { label: 'Test my knowledge with 3 questions', text: 'Generate 3 quick multiple-choice questions to test my understanding of Git branching and merge conflicts.' }
];

export default function AiTutorPage() {
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [weakTopics, setWeakTopics] = useState([]);
  const [aiProvider, setAiProvider] = useState('groq'); // groq is fast default
  const [loading, setLoading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  
  const { user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const scrollRef = useRef(null);

  const fetchContext = async () => {
    try {
      const res = await api.get('/ai/weak-topics');
      setWeakTopics(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch weak topics:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputMessage;
    if (!msg.trim()) return;

    if (!textToSend) {
      setInputMessage('');
    }

    // Add user message locally
    const newUserMsg = { id: Date.now().toString(), sender: 'user', content: msg };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ai/tutor/chat', {
        chatId: chatId || undefined,
        message: msg,
        aiProvider,
      });

      const data = res.data.data;
      setChatId(data.chatId);
      
      // Add assistant response locally
      const newAssistantMsg = { 
        id: (Date.now() + 1).toString(), 
        sender: 'assistant', 
        content: data.response 
      };
      setMessages(prev => [...prev, newAssistantMsg]);
      
      // Message successfully sent

    } catch (err) {
      console.error('Failed to send tutor message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPromptClick = (text) => {
    handleSendMessage(text);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brutal-cream py-8 px-4 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
      
      {/* Sidebar: User stats and weak topics */}
      <div className="w-full md:w-80 shrink-0 space-y-6">
        
        {/* Active path indicator */}
        <Card bg="#FFFFFF" className="p-5">
          <h3 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Mentor Target Path</h3>
          <span className="bg-brutal-yellow border-2 border-black px-3 py-1 text-sm font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wide inline-block">
            {user?.profile?.chosenCareerPath || 'No active path'}
          </span>
          <p className="text-xs font-bold text-black/60 mt-3">
            Your AI mentor is analyzing this curriculum to personalize doubt solving.
          </p>
        </Card>

        {/* Weak Topics analysis */}
        <Card bg="#FFFFFF" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-black" />
            <h3 className="text-sm font-black uppercase text-black tracking-wider">Weak Topics Analysis</h3>
          </div>
          
          {loadingContext ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="bg-brutal-green/10 border-2 border-black p-3 rounded-xl text-center shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs font-black text-black">🎉 No weak topics! Keep studying!</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-black/60">AI spotted scores below 70% in these modules. Click to review:</p>
              {weakTopics.map(topic => (
                <div 
                  key={topic.name}
                  onClick={() => handleQuickPromptClick(`I want to review my weak topic "${topic.name}". Can you explain the concepts simply and give a practice question?`)}
                  className="cursor-pointer bg-brutal-pink/15 hover:bg-brutal-pink/35 border-2 border-black p-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <span className="font-extrabold text-xs text-black block uppercase">{topic.name}</span>
                  <span className="text-[10px] font-bold text-black/65 block mt-0.5">Average Score: {Math.round(topic.averageScore)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col justify-between bg-white border-[3px] border-black rounded-2xl shadow-brutal overflow-hidden h-[calc(100vh-140px)] md:h-[650px]">
        
        {/* Chat Header */}
        <div className="p-4 border-b-[3px] border-black bg-brutal-cream flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <Brain className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-black text-base uppercase text-black flex items-center gap-1.5">
                AI Career Guidance Mentor <Sparkles className="w-4 h-4" />
              </h2>
              <span className="text-[10px] font-mono font-bold text-black/60 block">Online • Ready to solve doubts</span>
            </div>
          </div>

          {/* Provider selector switch */}
          <div className="flex items-center border-2 border-black rounded-lg overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button 
              onClick={() => setAiProvider('groq')}
              className={`px-3 py-1 text-xs font-black uppercase transition-all ${
                aiProvider === 'groq' ? 'bg-brutal-yellow text-black border-r-2 border-black' : 'text-black/60 hover:text-black'
              }`}
            >
              Groq (Fast)
            </button>
            <button 
              onClick={() => setAiProvider('gemini')}
              className={`px-3 py-1 text-xs font-black uppercase transition-all ${
                aiProvider === 'gemini' ? 'bg-brutal-yellow text-black border-l-2 border-black' : 'text-black/60 hover:text-black'
              }`}
            >
              Gemini
            </button>
          </div>
        </div>

        {/* Messages feed */}
        <div className="flex-1 p-6 overflow-y-auto bg-brutal-cream/20 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <MessageSquare className="w-12 h-12 text-black animate-bounce" />
              <div>
                <h3 className="font-black uppercase text-lg text-black">Ask Your AI Learning Mentor</h3>
                <p className="text-xs font-bold text-black/65 max-w-sm mt-1">
                  Solve logic doubts, review code, or request simpler conceptual explanations in real-time.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div key={m.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-xl border-[3px] border-black p-4 shadow-brutal ${
                    isAssistant ? 'bg-white text-black' : 'bg-brutal-yellow text-black font-semibold'
                  }`}>
                    <span className="text-[9px] font-mono font-black text-black/40 block mb-1 uppercase">
                      {isAssistant ? 'AI Mentor' : 'You'}
                    </span>
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-bold select-text">
                      {m.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Loader bubble */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl border-[3px] border-black p-4 shadow-brutal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick Prompts Container */}
        {messages.length === 0 && (
          <div className="px-6 py-4 border-t-[3px] border-black bg-brutal-cream/50">
            <h4 className="text-xs font-black uppercase text-black/50 tracking-wider mb-2">Suggested Quick Prompts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map(qp => (
                <button
                  key={qp.label}
                  onClick={() => handleQuickPromptClick(qp.text)}
                  className="text-left bg-white hover:bg-brutal-yellow border-2 border-black p-2.5 rounded-lg text-xs font-black text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 border-t-[3px] border-black bg-white flex gap-3">
          <input
            type="text"
            placeholder="Type your coding doubt or conceptual question..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 border-[3px] border-black bg-white px-4 py-3 text-sm font-bold text-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            bg="#FFE600"
            className="shrink-0 aspect-square flex items-center justify-center p-3 rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

      </div>

    </div>
  );
}
