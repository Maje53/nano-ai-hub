import { useState } from 'react'
import './App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txHistory, setTxHistory] = useState([])

  const handleAsk = async () => {
    if (!question.trim()) return

    setLoading(true)
    setError('')
    setAnswer('')

    try {
      // Backend'e sor
      const response = await fetch('http://localhost:3001/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Bir hata oluştu')
        return
      }

      setAnswer(data.answer)

      // İşlem geçmişine ekle
      setTxHistory(prev => [{
        id: Date.now(),
        question: question.slice(0, 50) + (question.length > 50 ? '...' : ''),
        time: new Date().toLocaleTimeString(),
        tokens: data.tokens,
        amount: '$0.001 USDC',
      }, ...prev])

      setQuestion('')

    } catch (err) {
      setError('Server bağlantı hatası. Server çalışıyor mu?')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 8px 0',
        }}>
          ⚡ NanoAI
        </h1>
        <p style={{ color: '#888', fontSize: '1rem', margin: 0 }}>
          Her soru <strong style={{ color: '#00d4ff' }}>$0.001 USDC</strong> — Arc Testnet üzerinde anında ödeme
        </p>
      </div>

      {/* Ana Kart */}
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
      }}>

        {/* Soru Kutusu */}
        <div style={{
          background: '#13131a',
          border: '1px solid #222',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu yazın... (Enter ile gönder)"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '120px',
              background: '#0a0a0f',
              border: '1px solid #333',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              padding: '16px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
          />

          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#333' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ İşleniyor...' : '⚡ Sor · $0.001 USDC'}
          </button>
        </div>

        {/* Hata */}
        {error && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid #ff4444',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ff6666',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Cevap */}
        {answer && (
          <div style={{
            background: '#13131a',
            border: '1px solid #00d4ff33',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <div style={{ color: '#00d4ff', fontWeight: '700', marginBottom: '12px' }}>
              🤖 NanoAI Cevabı
            </div>
            <div style={{
              color: '#ddd',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
            }}>
              {answer}
            </div>
          </div>
        )}

        {/* İşlem Geçmişi */}
        {txHistory.length > 0 && (
          <div style={{
            background: '#13131a',
            border: '1px solid #222',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ fontWeight: '700', marginBottom: '16px', color: '#888' }}>
              📊 İşlem Geçmişi ({txHistory.length} işlem)
            </div>
            {txHistory.map(tx => (
              <div key={tx.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#0a0a0f',
                borderRadius: '8px',
                marginBottom: '8px',
                fontSize: '0.85rem',
              }}>
                <div>
                  <div style={{ color: '#fff', marginBottom: '4px' }}>{tx.question}</div>
                  <div style={{ color: '#555' }}>{tx.time} · {tx.tokens} token</div>
                </div>
                <div style={{ color: '#00d4ff', fontWeight: '700' }}>{tx.amount}</div>
              </div>
            ))}
            <div style={{
              textAlign: 'right',
              color: '#888',
              fontSize: '0.85rem',
              marginTop: '12px',
            }}>
              Toplam: ${(txHistory.length * 0.001).toFixed(3)} USDC
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App