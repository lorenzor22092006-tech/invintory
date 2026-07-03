'use client'

import { useState, useEffect, useRef } from 'react'
import { colors, radius, shadow, S } from '@/lib/theme'

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
          0%, 100% { box-shadow: 0 4px 24px rgba(6, 182, 212, 0.35); }
          50% { box-shadow: 0 6px 32px rgba(6, 182, 212, 0.55); }
        }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Apri Vito AI"
          style={{
            position: 'fixed',
            bottom: 'var(--inv-fab-bottom)',
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.accentBright} 0%, ${colors.accent} 100%)`,
            border: `1px solid rgba(255,255,255,0.12)`,
            cursor: 'pointer',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'vito-pulse 2.5s ease-in-out infinite',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill={colors.onAccent} opacity="0.95" />
            <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" fill={colors.onAccent} opacity="0.75" />
          </svg>
        </button>
      )}

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={S.overlay} />

          <div
            style={{
              ...S.sheet,
              position: 'fixed',
              maxWidth: 420,
              width: '100%',
              maxHeight: 'min(640px, 85dvh)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0,
              zIndex: 61,
            }}
          >
            <div
              style={{
                padding: '16px 18px 14px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radius.md,
                  background: colors.accentSoft,
                  border: `1px solid ${colors.borderStrong}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill={colors.accentBright} />
                </svg>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>Vito</div>
                <div style={{ fontSize: 11, color: colors.accentBright, fontWeight: 700, marginTop: 2 }}>
                  Operatore AI · Rubinos Sellers
                </div>
              </div>

              <button onClick={() => setIsOpen(false)} className="inv-icon-btn inv-btn-glass" style={S.iconBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

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
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 10,
                        background: colors.accentSoft,
                        border: `1px solid ${colors.borderStrong}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill={colors.accentBright} />
                      </svg>
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: '76%',
                      padding: '11px 14px',
                      borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                      background: msg.role === 'user' ? colors.accentBright : colors.bgElevated,
                      border: msg.role === 'user' ? 'none' : `1px solid ${colors.border}`,
                      color: msg.role === 'user' ? colors.onAccent : colors.text,
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

              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      background: colors.accentSoft,
                      border: `1px solid ${colors.borderStrong}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill={colors.accentBright} />
                    </svg>
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '20px 20px 20px 6px',
                      background: colors.bgElevated,
                      border: `1px solid ${colors.border}`,
                      display: 'flex',
                      gap: 5,
                    }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: colors.accentBright,
                          animation: `vito-bounce 1.3s ${j * 0.2}s ease-in-out infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div
              style={{
                padding: '12px 18px 18px',
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                gap: 10,
                flexShrink: 0,
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
                  ...S.input,
                  flex: 1,
                  borderRadius: radius.pill,
                  opacity: loading ? 0.6 : 1,
                  minWidth: 0,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  ...S.iconBtn,
                  background: input.trim() && !loading ? colors.accentBright : colors.bgElevated,
                  color: input.trim() && !loading ? colors.onAccent : colors.textMuted,
                  border: input.trim() && !loading ? 'none' : `1px solid ${colors.border}`,
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() && !loading ? shadow.accent : 'none',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
