'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING = 'Ciao, sono Vito, il tuo operatore AI, come posso aiutarti oggi?'

export default function VitoButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: GREETING }])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 350)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/vito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || `Errore: ${data.error}` || 'Scusa, qualcosa è andato storto.',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Non riesco a rispondere in questo momento. Riprova.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes vito-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes vito-pulse {
          0%, 100% { box-shadow: 0 4px 18px rgba(16,185,129,0.45); }
          50% { box-shadow: 0 4px 28px rgba(16,185,129,0.75); }
        }
      `}</style>

      {/* Pallino floating */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Apri Vito AI"
          style={{
            position: 'fixed',
            top: 13,
            right: 16,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'vito-pulse 2.5s ease-in-out infinite',
          }}
        >
          {/* Sparkle / AI icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"
              fill="white"
              opacity="0.7"
            />
            <path
              d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"
              fill="white"
              opacity="0.6"
            />
          </svg>
        </button>
      )}

      {/* Chat overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 60,
            }}
          />

          {/* Chat panel */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 430,
              height: '84dvh',
              zIndex: 61,
              background: '#0B1F1A',
              borderRadius: '22px 22px 0 0',
              border: '1.5px solid #1B3A34',
              borderBottom: 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px 12px',
                borderBottom: '1px solid #1B3A34',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
                background: '#0B1F1A',
              }}
            >
              {/* Avatar Vito */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.25) 0%, rgba(5,150,105,0.15) 100%)',
                  border: '1.5px solid #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
                    fill="#10B981"
                    opacity="0.9"
                  />
                  <path
                    d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"
                    fill="#10B981"
                    opacity="0.7"
                  />
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC' }}>Vito</div>
                <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 1 }}>
                  Operatore AI · Rubinos Sellers
                </div>
              </div>

              {/* Pulsante chiudi */}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#102A24',
                  border: '1px solid #1B3A34',
                  borderRadius: 10,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Messaggi */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  {/* Mini avatar Vito per messaggi suoi */}
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 8,
                        background: 'rgba(16,185,129,0.2)',
                        border: '1px solid #10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginBottom: 2,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
                          fill="#10B981"
                        />
                      </svg>
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '76%',
                      padding: '10px 13px',
                      borderRadius:
                        msg.role === 'user'
                          ? '16px 16px 5px 16px'
                          : '16px 16px 16px 5px',
                      background: msg.role === 'user' ? '#10B981' : '#102A24',
                      border: msg.role === 'user' ? 'none' : '1px solid #1B3A34',
                      color: '#F8FAFC',
                      fontSize: 14,
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: 8,
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid #10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"
                        fill="#10B981"
                      />
                    </svg>
                  </div>
                  <div
                    style={{
                      padding: '11px 15px',
                      borderRadius: '16px 16px 16px 5px',
                      background: '#102A24',
                      border: '1px solid #1B3A34',
                      display: 'flex',
                      gap: 5,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#10B981',
                          animation: `vito-bounce 1.3s ${j * 0.2}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: '10px 12px 30px',
                borderTop: '1px solid #1B3A34',
                display: 'flex',
                gap: 9,
                flexShrink: 0,
                background: '#0B1F1A',
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Scrivi a Vito…"
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#102A24',
                  border: '1.5px solid #1B3A34',
                  borderRadius: 12,
                  padding: '11px 14px',
                  color: '#F8FAFC',
                  fontSize: 15,
                  outline: 'none',
                  opacity: loading ? 0.6 : 1,
                  minWidth: 0,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background:
                    input.trim() && !loading ? '#10B981' : '#102A24',
                  border:
                    input.trim() && !loading
                      ? 'none'
                      : '1.5px solid #1B3A34',
                  color: input.trim() && !loading ? 'white' : '#64748B',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow:
                    input.trim() && !loading
                      ? '0 2px 12px rgba(16,185,129,0.35)'
                      : 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
