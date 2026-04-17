/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Play, Square, Loader2, Volume2, ShieldAlert, CheckCircle2, Plus, Edit2, Trash2, X, Save, QrCode, Share2 } from "lucide-react";

interface QuizItem {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex?: number;
}

interface UserInfo {
  name: string;
  department: string;
}

const INITIAL_QUIZ_DATA: QuizItem[] = [
  {
    id: 1,
    question: "ข้อ 1.สินทรัพย์ที่ล้ำค่าที่สุดที่เราทุกคนนำติดตัวมาทำงานด้วยในทุกๆ วันคืออะไร?",
    options: ["ก. ประสบการณ์การทำงาน", "ข. ร่างกายและชีวิตของเรา", "ค. ความรับผิดชอบในหน้าที่", "ง. ความรู้และความสามารถ"],
    correctAnswerIndex: 1
  },
  {
    id: 2,
    question: "ข้อ 2.เหตุการณ์ที่ 'เกือบไปแล้ว' เช่น เดินสะดุดแต่ไม่ล้ม หรือของตกเฉียดศีรษะไปเล็กน้อย เรียกว่าอะไรในวิชาความปลอดภัย?",
    options: ["ก. ความประมาทเลินเล่อ", "ข. การเกือบเกิดอุบัติเหตุ (Near-miss)", "ค. อุบัติเหตุ (Accident)", "ง. โชคชะตาที่ดี"],
    correctAnswerIndex: 1
  },
  {
    id: 3,
    question: "ข้อ 3.ตามทฤษฎีภูเขาน้ำแข็งแห่งความสูญเสีย 'ค่ารักษาพยาบาล' และ 'ค่าซ่อมเครื่องจักร' จัดเป็นความสูญเสียประเภทใด?",
    options: ["ก. ความสูญเสียมหาศาล", "ข. ผลกระทบระยะยาว", "ค. ผลกระทบทางอ้อม", "ง. ผลกระทบทางตรง"],
    correctAnswerIndex: 3
  },
  {
    id: 4,
    question: "ข้อ 4.จากข้อมูลสถิติ อุบัติเหตุส่วนหนึ่ง (ประมาณ 85%) มีสาเหตุหลักมาจากปัจจัยใด?",
    options: ["ก. ภัยธรรมชาติที่ควบคุมไม่ได้", "ข. การกระทำที่ไม่ปลอดภัย", "ค. สภาพแวดล้อมที่ไม่ปลอดภัย", "ง. ความขัดข้องของระบบไฟฟ้า"],
    correctAnswerIndex: 1
  },
  {
    id: 5,
    question: "ข้อ 5.ข้อใดจัดเป็น 'สภาพการทำงานที่ไม่ปลอดภัย' (Unsafe Condition)?",
    options: ["ก. การทำงานฝืนร่างกายขณะเจ็บป่วย", "ข. พนักงานไม่ยอมสวมใส่ PPE", "ค. เครื่องจักรไม่มีการ์ดป้องกันหรือพื้นทางเดินลื่น", "ง. การหยอกล้อกันขณะทำงาน"],
    correctAnswerIndex: 2
  },
  {
    id: 6,
    question: "ข้อ 6. ขณะปฏิบัติงานกับเครื่องสับไม้ สิ่งใดที่ห้ามสวมใส่เด็ดขาดเนื่องจากอาจถูกเครื่องจักรพันและดึงเข้าไปได้?",
    options: ["ก. แว่นตานิรภัยและที่อุดหู", "ข. สร้อยคอ แหวน หรือสายสิญจน์", "ค. รองเท้าเซฟตี้หัวเหล็ก", "ง. หน้ากากกันฝุ่น"],
    correctAnswerIndex: 1
  },
  {
    id: 7,
    question: "ข้อ 7.อุปกรณ์ PPE ชนิดใดที่มีหน้าที่ป้องกันอันตรายจากเสียงดังของเครื่องจักรตลอดเวลาการทำงาน?",
    options: ["ก. หมวกนิรภัย", "ข. ที่อุดหู (Earplugs)", "ค. หน้ากากนิรภัย", "ง. ชุดเอี๊ยม"],
    correctAnswerIndex: 1
  },
  {
    id: 8,
    question: "ข้อ 8.กฎเหล็กที่สำคัญที่สุดเมื่อเห็นป้าย 'ห้ามเปิดเครื่อง' หรือการ์ดป้องกันถูกถอดออกคืออะไร?",
    options: ["ก. ถอดป้ายออกแล้วค่อยทำงานต่อ", "ข. รีบเปิดเครื่องเพื่อทดสอบว่ายังใช้งานได้ไหม", "ค. ห้ามเปิดเครื่องหรือยุ่งเกี่ยวกับการ์ดป้องกันเด็ดขาด", "ง. ถามเพื่อนร่วมงานว่าทำไมถึงติดป้ายไว้"],
    correctAnswerIndex: 2
  },
  {
    id: 9,
    question: "ข้อ 9.การทำงานกับเครื่องจักรขนาดใหญ่ที่ต้องใช้สมาธิสูง พฤติกรรมใดต่อไปนี้ที่ถือว่าอันตรายและอาจเปลี่ยนชีวิตไปตลอดกาล?",
    options: ["ก. การแจ้งหัวหน้าเมื่อพบสิ่งผิดปกติ", "ข. การก้มมองหน้าจอโทรศัพท์มือถือ", "ค. การสวมใส่แว่นตานิรภัยตลอดเวลา", "ง. การอ่านคู่มือการทำงานก่อนเริ่มงาน"],
    correctAnswerIndex: 1
  },
  {
    id: 10,
    question: "ข้อ 10.วัฒนธรรมความปลอดภัยที่เรียกว่า 'Safety First' หรือ ปลอดภัยไว้ก่อน มีความหมายที่แท้จริงอย่างไร?",
    options: ["ก. เป็นเรื่องของหัวหน้างานที่ต้องคอยสั่งการ", "ข. เป็นเพียงคำขวัญสวยๆ ที่ติดไว้หน้าโรงงาน", "ค. เป็นกฎระเบียบที่ทำให้ทำงานได้ช้าลง", "ง. เป็นทัศนคติที่ต้องให้ความปลอดภัยมาเป็นอันดับ 1 ในทุกการกระทำ"],
    correctAnswerIndex: 3
  }
];

export default function App() {
  const [questions, setQuestions] = useState<QuizItem[]>(INITIAL_QUIZ_DATA);
  const [loadingId, setLoadingId] = useState<number | 'all' | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(true);
  const [regForm, setRegForm] = useState<UserInfo>({ name: '', department: '' });
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  
  // CRUD States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuizItem | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const score = useMemo(() => {
    return Object.entries(userAnswers).reduce((acc, [qId, selectedIdx]) => {
      const question = questions.find(q => q.id === Number(qId));
      if (question && question.correctAnswerIndex === selectedIdx) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [userAnswers, questions]);

  const resetQuiz = () => {
    if (confirm("ต้องการรีเซ็ตคำถามและคำตอบทั้งหมดใช่หรือไม่?")) {
      setQuestions(INITIAL_QUIZ_DATA);
      setUserAnswers({});
      setIsSubmitted(false);
      setIsRegistering(true);
      setUserInfo(null);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.name && regForm.department) {
      setUserInfo(regForm);
      setIsRegistering(false);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitted(true);
    setIsSendingEmail(true);
    
    // Prepare results for email
    const quizResults = questions.map(q => ({
      question: q.question,
      userAnswer: q.options[userAnswers[q.id] || 0],
      correctAnswer: q.options[q.correctAnswerIndex || 0],
      isCorrect: userAnswers[q.id] === q.correctAnswerIndex
    }));

    try {
      const response = await fetch('/api/send-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo,
          score,
          total: questions.length,
          results: quizResults
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      console.log('Results sent to supervisor');
    } catch (error: any) {
      console.error('Email error:', error);
      alert(`ไม่สามารถส่งอีเมลได้: ${error.message}\n\nกรุณาตรวจสอบการตั้งค่า App Password ใน Secrets ครับ`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = binaryString.charCodeAt(i) | (binaryString.charCodeAt(i + 1) << 8);
      }

      const float32Data = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32Data[i] = bytes[i] / 32768;
      }

      const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = speechSpeed;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setAudioSource(null);
      };

      source.start();
      setAudioSource(source);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  }, [speechSpeed]);

  const stopAudio = useCallback(() => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
      setIsPlaying(false);
    }
  }, [audioSource]);

  const handleTTS = async (text: string, id: number | 'all') => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setLoadingId(id);
    try {
      const prompt = `Translate this text to speech in a clear, professional male voice: ${text}`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' }, // Male voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playAudio(base64Audio);
      }
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handlePlayAll = async () => {
    const fullText = questions.map(q => `${q.question}\n${q.options.join('\n')}`).join('\n\n');
    await handleTTS(fullText, 'all');
  };

  // CRUD Operations
  const openEditor = (item: QuizItem | null = null) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({
        id: Date.now(),
        question: `ข้อ ${questions.length + 1}. `,
        options: ["ก. ", "ข. ", "ค. ", "ง. "]
      });
    }
    setIsEditorOpen(true);
  };

  const saveQuestion = () => {
    if (!editingItem) return;
    
    if (questions.find(q => q.id === editingItem.id)) {
      setQuestions(prev => prev.map(q => q.id === editingItem.id ? editingItem : q));
    } else {
      setQuestions(prev => [...prev, editingItem]);
    }
    setIsEditorOpen(false);
    setEditingItem(null);
  };

  const deleteQuestion = (id: number) => {
    if (confirm("ต้องการลบคำถามข้อนี้ใช่หรือไม่?")) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const updateEditingOption = (index: number, value: string) => {
    if (!editingItem) return;
    const newOptions = [...editingItem.options];
    newOptions[index] = value;
    setEditingItem({ ...editingItem, options: newOptions });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--light-grey)]">
      {/* Header */}
      <header className="bg-[var(--dark-grey)] text-white p-4 border-b-4 border-[var(--safety-yellow)] flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="safety-icon text-lg">!</div>
          <div className="leading-tight">
            <div className="font-extrabold text-lg tracking-wider">On TheJOB traning</div>
            <div className="text-[10px] opacity-70 uppercase tracking-tighter">Safety Induction Training v2.4</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-full transition-all border border-white/10"
          >
            <QrCode size={14} /> Share App
          </button>
          <div className="flex items-center gap-2 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Ready to Process
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col bg-white border-r border-[var(--border-color)] p-8 gap-8 overflow-y-auto">
          <div className="space-y-3">
            <label className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Voice Profile</label>
            <div className="voice-badge">
              <span className="text-2xl">👨</span>
              <div>
                <div className="font-bold text-sm text-[var(--dark-grey)]">Male Voice (Thai)</div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Standard Professional</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Speech Speed</label>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1" 
              value={speechSpeed} 
              onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-[var(--light-grey)] rounded-lg appearance-none cursor-pointer accent-[var(--safety-orange)]"
            />
            <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)]">
              <span>0.5x</span>
              <span className="text-[var(--safety-orange)] bg-[var(--safety-orange)]/10 px-2 py-0.5 rounded">{speechSpeed.toFixed(1)}x</span>
              <span>2.0x</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Output Format</label>
            <select className="w-full p-2.5 bg-[var(--light-grey)] border border-[var(--border-color)] rounded text-sm font-medium text-[var(--dark-grey)] focus:ring-1 focus:ring-[var(--safety-orange)] outline-none transition-all">
              <option>WAV (High Fidelity)</option>
              <option>MP3 (Standard)</option>
              <option>OGG (Web Optimized)</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Quiz Progress</label>
            <div className="bg-white p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-md border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Final Score</span>
                    <span className="text-lg font-black text-emerald-600">{score}/{questions.length}</span>
                  </div>
                  <div className="text-[9px] text-center font-bold text-emerald-600 bg-emerald-50 py-1 rounded">
                    {isSendingEmail ? "กำลังส่งผลการทดสอบ..." : "ส่งรายงานเรียบร้อยแล้ว ✅"}
                  </div>
                  <div className="text-[10px] font-medium text-[var(--text-muted)] text-center italic">
                    {score === questions.length ? "ยินดีด้วย! คุณตอบถูกทุกข้อ" : "เกือบสมบูรณ์แบบ! ลองทบทวนข้อที่ผิดดูนะ"}
                  </div>
                  <button 
                    onClick={() => { setUserAnswers({}); setIsSubmitted(false); }}
                    className="w-full py-2 bg-[var(--light-grey)] text-[var(--dark-grey)] text-[10px] font-bold rounded uppercase hover:bg-[var(--border-color)] transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : Object.keys(userAnswers).length === questions.length ? (
                <div className="space-y-3 text-center">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">All Questions Answered!</div>
                  <button 
                    onClick={submitQuiz}
                    className="w-full py-3 bg-emerald-600 text-white text-xs font-black rounded-lg uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Submit & Send Results
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Answering Status</span>
                    <span className="text-[10px] font-black text-[var(--dark-grey)]">{Object.keys(userAnswers).length}/{questions.length}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--light-grey)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--safety-orange)] transition-all duration-500"
                      style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-center font-bold text-[var(--safety-orange)] animate-pulse uppercase tracking-widest pt-1">
                    Waiting for completion...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-[var(--light-grey)]">
            <button className="w-full py-3 bg-[var(--dark-grey)] text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-[var(--slate-grey)] transition-colors shadow-lg active:translate-y-px">
              Export Audio File
            </button>
          </div>
        </aside>

        {/* Script Area */}
        <section className="flex flex-col p-6 sm:p-8 gap-4 overflow-hidden bg-[var(--light-grey)]">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[var(--dark-grey)] tracking-tight">Audio Script Preview</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => openEditor()}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus size={14} /> เพิ่มคำถาม
              </button>
              <div className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--border-color)] px-2 py-1 rounded">
                {questions.length} Questions | {questions.reduce((acc, q) => acc + q.question.length, 0)} Chars
              </div>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8 space-y-8">
              {questions.map((item) => (
                <div key={item.id} className="quiz-item-border group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex gap-3 text-sm font-bold leading-relaxed text-[var(--dark-grey)]">
                      <p>{item.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => openEditor(item)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[var(--light-grey)] text-[var(--text-muted)] hover:bg-sky-500 hover:text-white"
                        title="แก้ไข"
                      >
                        <Edit2 size={14} />
                      </button>
                       <button 
                        onClick={() => deleteQuestion(item.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[var(--light-grey)] text-[var(--text-muted)] hover:bg-rose-500 hover:text-white"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleTTS(`${item.question}\n${item.options.join('\n')}`, item.id)}
                        disabled={loadingId !== null && loadingId !== item.id}
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center transition-all
                          ${loadingId === item.id ? 'bg-indigo-100 text-indigo-600' : 'bg-[var(--light-grey)] text-[var(--text-muted)] hover:bg-[var(--safety-orange)] hover:text-white'}
                          ${(loadingId !== null && loadingId !== item.id) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {loadingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <Play className="fill-current" size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4 md:ml-6 mt-2">
                    {item.options.map((option, idx) => {
                      const isSelected = userAnswers[item.id] === idx;
                      const isCorrect = item.correctAnswerIndex === idx;
                      const hasAnswered = userAnswers[item.id] !== undefined;

                      let variantClasses = "bg-[var(--light-grey)] text-[var(--text-muted)] border-transparent hover:border-[var(--safety-orange)]";
                      
                      if (isSubmitted) {
                        if (isCorrect) {
                          variantClasses = "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20";
                        } else if (isSelected) {
                          variantClasses = "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20";
                        }
                      } else if (isSelected) {
                        variantClasses = "bg-[var(--safety-orange)] text-white border-transparent";
                      }

                      return (
                        <button
                          key={idx}
                          id={`question-${item.id}-option-${idx}`}
                          onClick={() => handleSelectAnswer(item.id, idx)}
                          className={`
                            group/opt text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all duration-200
                            flex items-start gap-3 relative overflow-hidden
                            ${variantClasses}
                            ${(isSubmitted || (loadingId !== null)) ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-px active:scale-95'}
                          `}
                        >
                          <span className={`
                            flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black
                            ${isSelected ? 'bg-white/20' : 'bg-black/5'}
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{option.split('.').slice(1).join('.').trim() || option}</span>
                          
                          {isSubmitted && isCorrect && (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          )}
                          {isSubmitted && isSelected && !isCorrect && (
                            <X size={14} className="text-rose-500" />
                          )}
                          
                          <motion.div 
                            className="absolute inset-0 bg-black/5 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                            initial={false}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer / Controls */}
      <footer className="h-[100px] bg-white border-t border-[var(--border-color)] px-8 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
        <div className="flex items-center gap-6 flex-1 max-w-2xl">
          <div className="text-[xs] font-mono text-[var(--text-muted)] w-24">
            {isPlaying ? 'PLAYING...' : '00:00 / --:--'}
          </div>
          
          <div className="flex items-center gap-3">
            <button className="playback-btn w-10 h-10 bg-slate-100 text-[var(--text-muted)] hover:bg-slate-200">
              <span className="rotate-180">▶▶</span>
            </button>
            <button 
              onClick={isPlaying ? stopAudio : handlePlayAll}
              disabled={loadingId === 'all'}
              className={`
                ${isPlaying ? 'playback-btn' : 'playback-btn-primary'} 
                w-14 h-14 relative flex items-center justify-center
                ${loadingId === 'all' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {loadingId === 'all' ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isPlaying ? (
                <Square className="fill-current" size={20} />
              ) : (
                <Play className="fill-current ml-1" size={24} />
              )}
            </button>
            <button className="playback-btn w-10 h-10 bg-slate-100 text-[var(--text-muted)] hover:bg-slate-200">
              <span>▶▶</span>
            </button>
          </div>

          <div className="flex-1 max-w-xs h-1.5 bg-[var(--light-grey)] rounded-full relative overflow-hidden hidden sm:block">
            <motion.div 
              className="absolute h-full bg-[var(--safety-orange)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: isPlaying ? '100%' : '0%' }}
              transition={{ duration: isPlaying ? 30 : 0.5, ease: "linear" }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={resetQuiz}
            className="px-5 py-2.5 text-xs font-bold border border-[var(--border-color)] rounded hover:bg-[var(--light-grey)] transition-colors uppercase tracking-wider text-[var(--text-muted)]"
          >
            Reset
          </button>
          <button className="px-5 py-2.5 text-xs font-bold bg-[var(--safety-yellow)] border border-[var(--safety-yellow)] rounded hover:brightness-110 transition-all uppercase tracking-wider text-black shadow-sm">
            Save Script
          </button>
        </div>
      </footer>

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {isEditorOpen && editingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border-t-4 border-[var(--safety-orange)]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--dark-grey)]">
                  {questions.find(q => q.id === editingItem.id) ? 'Edit Question' : 'New Question'}
                </h3>
                <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Question Text</label>
                  <textarea 
                    value={editingItem.question}
                    onChange={(e) => setEditingItem({...editingItem, question: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold resize-none h-24 focus:ring-2 focus:ring-[var(--safety-orange)] focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                    placeholder="ป้อนคำถาม..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Options</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editingItem.options.map((option, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-bold text-slate-400 capitalize">Option {idx + 1}</label>
                          <button 
                            onClick={() => setEditingItem({...editingItem, correctAnswerIndex: idx})}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${editingItem.correctAnswerIndex === idx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                          >
                            {editingItem.correctAnswerIndex === idx ? 'Correct Answer' : 'Set Correct'}
                          </button>
                        </div>
                        <input 
                          type="text" 
                          value={option}
                          onChange={(e) => updateEditingOption(idx, e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--safety-orange)] focus:border-transparent outline-none transition-all"
                          placeholder={`${idx === 0 ? 'ก.' : idx === 1 ? 'ข.' : idx === 2 ? 'ค.' : 'ง.'} ป้อนตัวเลือก...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveQuestion}
                  className="px-8 py-2.5 bg-[var(--dark-grey)] text-white text-xs font-bold rounded-lg uppercase tracking-widest hover:bg-[var(--slate-grey)] transition-all shadow-lg flex items-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setIsShareModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--dark-grey)]">Share Quiz App</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-white border-8 border-[var(--light-grey)] rounded-2xl shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}&color=1a1c1e&bgcolor=ffffff&margin=10`} 
                    alt="QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-[var(--dark-grey)]">Scan to start the safety training</p>
                  <p className="text-[10px] text-[var(--text-muted)] break-all max-w-[250px] mx-auto">
                    {window.location.href}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("คัดลอกลิงก์เรียบร้อยแล้ว!");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-[var(--light-grey)] text-[var(--dark-grey)] text-[10px] font-bold rounded-xl uppercase tracking-wider hover:bg-[var(--border-color)] transition-all"
                  >
                    <Share2 size={14} /> Copy Link
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 py-3 bg-[var(--dark-grey)] text-white text-[10px] font-bold rounded-xl uppercase tracking-wider hover:bg-[var(--slate-grey)] transition-all"
                  >
                    Print QR
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegistering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-[var(--dark-grey)] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="safety-icon mb-4">i</div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">SAFETY QUIZ</h2>
                  <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Training Registration</p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[var(--safety-yellow)] rotate-45 opacity-20"></div>
              </div>

              <form onSubmit={handleRegister} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name / ชื่อ-นามสกุล</label>
                    <input 
                      required
                      type="text" 
                      value={regForm.name}
                      onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[var(--safety-orange)] focus:border-transparent outline-none transition-all"
                      placeholder="ป้อนชื่อ-นามสกุลของคุณ..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department / แผนก</label>
                    <input 
                      required
                      type="text" 
                      value={regForm.department}
                      onChange={(e) => setRegForm({...regForm, department: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[var(--safety-orange)] focus:border-transparent outline-none transition-all"
                      placeholder="ป้อนชื่อแผนก..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-[var(--dark-grey)] text-white text-sm font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-[var(--slate-grey)] transition-all shadow-xl active:scale-[0.98]"
                  >
                    Start Quiz Now
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



