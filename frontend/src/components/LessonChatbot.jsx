/**
 * @file LessonChatbot.jsx
 * @description Floating AI Chatbot panel gắn vào trang học bài (Learning.jsx).
 *
 * Props:
 *  - lessonId    {number} — ID bài học đang xem, dùng để gọi API POST /student/chat.
 *  - lessonTitle {string} — Tiêu đề bài học, hiển thị trong tin nhắn chào và header.
 *  - courseTitle {string} — Tiêu đề khóa học, hiển thị trong header panel.
 *
 * Tính năng:
 *  - Floating button 💬 "AI Hỏi đáp" cố định góc phải dưới màn hình.
 *  - Panel trượt lên khi mở, chứa lịch sử hội thoại + ô nhập câu hỏi.
 *  - Typing indicator (3 chấm bounce) khi AI đang xử lý.
 *  - Auto-scroll xuống tin nhắn mới nhất sau mỗi lần cập nhật.
 *  - Focus vào input tự động khi mở panel.
 *  - Reset hội thoại tự động khi học viên chuyển sang bài học khác.
 *  - Nhấn Enter để gửi; Shift+Enter để xuống dòng.
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { askLessonChatbot } from '../services/student.service';

// ── Bubble tin nhắn đơn lẻ ──────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isUser ? 'bg-[#8b0000]' : 'bg-zinc-700'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-zinc-300" />
        )}
      </div>

      {/* Nội dung tin nhắn */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#8b0000] text-white rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ── Typing indicator khi AI đang trả lời ────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-zinc-300" />
      </div>
      <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component chính ──────────────────────────────────────────────────────────
export default function LessonChatbot({ lessonId, lessonTitle, courseTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào! Tôi là trợ lý AI cho bài "${lessonTitle}". Bạn có câu hỏi gì về bài học này không? 😊`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll xuống khi có tin nhắn mới hoặc khi AI đang gõ
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus vào ô nhập khi mở panel
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  // Reset hội thoại mỗi khi học viên chuyển sang bài học khác
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Xin chào! Tôi là trợ lý AI cho bài "${lessonTitle}". Bạn có câu hỏi gì về bài học này không? 😊`,
      },
    ]);
    setInput('');
  }, [lessonId, lessonTitle]);

  // Gửi tin nhắn lên API
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Thêm tin nhắn user vào UI ngay lập tức (optimistic update)
    const userMsg = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // axiosInstance đã unwrap response.data → res.reply là trực tiếp
      const res = await askLessonChatbot({
        lesson_id: lessonId,
        messages: newMessages,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại! 🙏',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter = gửi, Shift+Enter = xuống dòng
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────────────── */}
      {!isOpen && (
        <button
          id="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3
                     bg-[#8b0000] hover:bg-[#a01828] text-white rounded-full shadow-2xl
                     shadow-black/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-semibold">AI Hỏi đáp</span>
        </button>
      )}

      {/* ── Chat Panel ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          id="chatbot-panel"
          className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px]
                     bg-zinc-900 border border-zinc-700/60 rounded-2xl
                     shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#8b0000]/90 border-b border-zinc-800 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                AI Trợ lý — {courseTitle}
              </p>
              <p className="text-red-200 text-xs truncate opacity-80">
                Bài: {lessonTitle}
              </p>
            </div>
            <button
              id="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
              aria-label="Đóng chatbot"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Khu vực tin nhắn */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Khu vực nhập tin */}
          <div className="px-3 py-3 border-t border-zinc-800 bg-zinc-900 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                id="chatbot-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Nhập câu hỏi về bài học... (Enter để gửi)"
                className="flex-1 bg-zinc-800 border border-zinc-700/60 text-zinc-200
                           placeholder-zinc-500 rounded-xl px-3 py-2.5 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-[#8b0000]
                           focus:border-transparent leading-snug"
                style={{ maxHeight: '96px', overflowY: 'auto' }}
              />
              <button
                id="chatbot-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-[#8b0000] hover:bg-[#a01828] disabled:bg-zinc-700
                           disabled:cursor-not-allowed rounded-xl flex items-center justify-center
                           transition-colors shrink-0"
                aria-label="Gửi câu hỏi"
              >
                {isLoading ? (
                  <Loader2 size={18} className="text-white animate-spin" />
                ) : (
                  <Send size={18} className="text-white" />
                )}
              </button>
            </div>
            <p className="text-zinc-600 text-xs mt-1.5 text-center">
              AI có thể mắc lỗi. Hãy xác minh thông tin quan trọng.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
