/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Award, 
  RefreshCcw,
  Info,
  Trophy,
  Star,
  GraduationCap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Question } from './types';
import { generateGrammarQuestion } from './services/grammarService';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [prefetchedQuestion, setPrefetchedQuestion] = useState<Question | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  // API Key Management
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [tempKey, setTempKey] = useState("");

  // Initial load
  useEffect(() => {
    const savedKey = localStorage.getItem('TOEFL_JUNIOR_API_KEY');
    const envKey = process.env.GEMINI_API_KEY;
    
    if (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey !== "") {
      setApiKey(envKey);
      loadInitialQuestions(envKey);
    } else if (savedKey) {
      setApiKey(savedKey);
      loadInitialQuestions(savedKey);
    } else {
      setShowKeySetup(true);
      setIsLoading(false);
    }
  }, []);

  // Prefetch logic
  useEffect(() => {
    if (showExplanation && !prefetchedQuestion && !isPrefetching && apiKey) {
      prefetchNext(apiKey);
    }
  }, [showExplanation, prefetchedQuestion, isPrefetching, apiKey]);

  const loadInitialQuestions = async (keyToUse: string) => {
    setIsLoading(true);
    const first = await generateGrammarQuestion(keyToUse);
    if (first) {
      setQuestions([first]);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      // Start prefetching the second one immediately
      setIsPrefetching(true);
      const second = await generateGrammarQuestion(keyToUse, [first.category]);
      setPrefetchedQuestion(second);
      setIsPrefetching(false);
    } else {
      // If generation fails, maybe the key is invalid
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
        setShowKeySetup(true);
      }
    }
    setIsLoading(false);
  };

  const prefetchNext = async (keyToUse: string) => {
    setIsPrefetching(true);
    const excludeTopics = questions.map(q => q.category).slice(-5);
    const next = await generateGrammarQuestion(keyToUse, excludeTopics);
    setPrefetchedQuestion(next);
    setIsPrefetching(false);
  };

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('TOEFL_JUNIOR_API_KEY', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeySetup(false);
      loadInitialQuestions(tempKey.trim());
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (showExplanation) return;
    setSelectedAnswer(option);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !questions[currentQuestionIndex]) return;

    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = async () => {
    if (prefetchedQuestion) {
      // Instant transition
      setQuestions(prev => [...prev, prefetchedQuestion]);
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setPrefetchedQuestion(null);
    } else {
      // Fallback
      setIsPrefetching(true);
      const excludeTopics = questions.map(q => q.category).slice(-5);
      const next = await generateGrammarQuestion(apiKey, excludeTopics);
      if (next) {
        setQuestions(prev => [...prev, next]);
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
      }
      setIsPrefetching(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (showKeySetup) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-100"
        >
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">配置 API Key</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            为了在 Vercel 或本地运行此应用，您需要提供一个 Google Gemini API Key。
            您可以从 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Google AI Studio</a> 免费获取。
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">API Key</label>
              <input 
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="粘贴您的 API Key (AIza...)"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white outline-none transition-all font-mono text-sm"
              />
            </div>
            <button 
              onClick={handleSaveKey}
              disabled={!tempKey.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              保存并开始练习
            </button>
            <p className="text-[10px] text-center text-slate-400 italic">
              您的 Key 将仅保存在本地浏览器中，不会上传到任何服务器。
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="w-12 h-12 text-indigo-600" />
        </motion.div>
        <p className="text-slate-500 font-bold animate-pulse">正在为您生成小托福语法挑战...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">加载失败</h2>
          <p className="text-slate-500 mb-6">
            无法获取题目。这通常是因为缺少 <strong>GEMINI_API_KEY</strong> 环境变量或 API 调用达到了限制。
          </p>
          <button 
            onClick={loadInitialQuestions}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">小托福语法大师 (Language Form)</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已答题数</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600">{currentQuestionIndex + 1}</span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/2 bg-indigo-600/30"
                  />
                </div>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">{score}</span>
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{currentQuestion.category}</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded border border-indigo-200 text-indigo-600 bg-indigo-50">
                    高级难度 (Advanced)
                  </span>
                </div>

                <div className="p-8">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800 leading-snug">
                      {currentQuestion.content.split('______').map((part, i, arr) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className={`inline-block min-w-[120px] border-b-2 mx-2 text-center transition-colors ${
                              showExplanation 
                                ? (selectedAnswer === currentQuestion.correctAnswer ? 'text-emerald-600 border-emerald-600' : 'text-red-600 border-red-600')
                                : (selectedAnswer ? 'text-indigo-600 border-indigo-600' : 'text-slate-300 border-slate-300')
                            }`}>
                              {selectedAnswer || '...'}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </h2>
                  </div>

                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={showExplanation}
                        className={`group relative p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          selectedAnswer === option 
                            ? (showExplanation 
                                ? (option === currentQuestion.correctAnswer ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50')
                                : 'border-indigo-600 bg-indigo-50 shadow-md')
                            : (showExplanation && option === currentQuestion.correctAnswer 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50')
                        }`}
                      >
                        <span className={`font-bold text-lg ${
                          selectedAnswer === option 
                            ? (showExplanation 
                                ? (option === currentQuestion.correctAnswer ? 'text-emerald-700' : 'text-red-700')
                                : 'text-indigo-700')
                            : (showExplanation && option === currentQuestion.correctAnswer ? 'text-emerald-700' : 'text-slate-600')
                        }`}>
                          {option}
                        </span>
                        
                        {showExplanation && option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        )}
                        {showExplanation && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                          <XCircle className="w-6 h-6 text-red-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm text-slate-400 font-medium">
                    {selectedAnswer ? '准备好检查了吗？' : '请选择一个答案继续'}
                  </div>
                  <div className="flex gap-3">
                    {!showExplanation ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
                      >
                        提交答案
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        disabled={isPrefetching && !prefetchedQuestion}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isPrefetching && !prefetchedQuestion ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            下一题
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Info className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">深度语法解析 (Advanced Analysis)</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">语法原理 (Rule)</p>
                        <p className="text-slate-700 text-lg leading-relaxed">{currentQuestion.explanation.rule}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">学术例句 (Example)</p>
                          <p className="text-emerald-800 font-medium italic">"{currentQuestion.explanation.example}"</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">常见陷阱 (Common Pitfall)</p>
                          <p className="text-red-800 font-medium">{currentQuestion.explanation.commonError}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                测试统计
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">正确题数</span>
                  <span className="font-bold text-emerald-600">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">正确率</span>
                  <span className="font-bold text-indigo-600">{Math.round((score / (currentQuestionIndex + 1)) * 100)}%</span>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">AI 状态</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    正在生成唯一题目
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -right-4 -bottom-4 opacity-10"
              >
                <BookOpen className="w-32 h-32" />
              </motion.div>
              <h3 className="font-bold text-xl mb-2 relative z-10">高分秘籍</h3>
              <p className="text-indigo-200 text-sm leading-relaxed relative z-10">
                小托福“语言形式”部分通常考察词汇在语境中的功能。在处理复杂句时，请特别注意平行结构和主谓一致。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
