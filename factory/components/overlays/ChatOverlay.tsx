'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatOverlayProps {
  onClose: () => void
  onGenerateWithContext: (context: string) => void
}

export default function ChatOverlay({ onClose, onGenerateWithContext }: ChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '[señal perdida — reintenta]' }])
    } finally {
      setLoading(false)
    }
  }

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')

  return (
    <div className="chat-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="chat-panel">
        <div className="chat-hdr">
          <span className="chat-title">◈ DR. ADDERALL</span>
          <button className="chat-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">_ esperando transmisión...</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              <span className="chat-msg-who">{m.role === 'user' ? 'TÚ' : 'DR.'}</span>
              <span className="chat-msg-text">{m.content}</span>
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg-assistant">
              <span className="chat-msg-who">DR.</span>
              <span className="chat-msg-text"><span className="chat-typing">_</span></span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="_ transmitir..."
            disabled={loading}
          />
          <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
            SEND
          </button>
        </div>

        {lastAssistantMsg && (
          <div className="chat-feed-row">
            <button
              className="chat-feed-btn"
              onClick={() => { onGenerateWithContext(lastAssistantMsg.content); onClose() }}
            >
              ⚡ GENERAR IDEAS CON ESTO
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
