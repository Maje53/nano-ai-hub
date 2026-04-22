import { useState, useEffect } from 'react'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [txHistory, setTxHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nanoai_txHistory')) || [] } catch { return [] }
  })
  const [wallet, setWallet] = useState('')

  useEffect(() => {
    localStorage.setItem('nanoai_txHistory', JSON.stringify(txHistory))
  }, [txHistory])
  const [marginCost, setMarginCost] = useState('')
  const [marginRevenue, setMarginRevenue] = useState('')

  const connectWallet = async () => {
    if (!window.ethereum) { setError('MetaMask not found!'); return }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setWallet(accounts[0])
  }

  const handleAsk = async () => {
    if (!question.trim() || !wallet) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: '0xCf87Ae43a6460ba1A780b9D297700784caA7c02f', value: '0x38D7EA4C68000' }],
      })
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/ask' : '/api/ask'
const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      setAnswer(data.answer)
      setTxHistory(prev => [{ id: Date.now(), question: question.slice(0, 40), time: new Date().toLocaleTimeString(), tokens: data.tokens, txHash }, ...prev])
      setQuestion('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff, #0099cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px 0' }}>NanoAI</h1>
        <p style={{ color: '#888', margin: '0 0 16px 0' }}>Every question costs <b style={{ color: '#00d4ff' }}>$0.001 USDC</b> — instant payment on Arc Testnet</p>
        <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginBottom: '16px', color: '#0099cc', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid #0099cc44', borderRadius: '8px', padding: '4px 12px' }}>🔗 ArcScan Testnet Explorer</a>
        <br />
        {!wallet
          ? <button onClick={connectWallet} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Connect Wallet</button>
          : <div style={{ display: 'inline-block', padding: '8px 16px', background: '#13131a', border: '1px solid #00d4ff44', borderRadius: '12px', color: '#00d4ff' }}>Connected: {wallet.slice(0,6)}...{wallet.slice(-4)}</div>
        }
      </div>
      {/* Stats Bar */}
      <div style={{ maxWidth: '700px', margin: '0 auto 32px auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Queries', value: txHistory.length },
          { label: 'Total Spent', value: `$${(txHistory.length * 0.001).toFixed(3)}` },
          { label: 'Total Tokens', value: txHistory.reduce((s, tx) => s + (tx.tokens || 0), 0) },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#13131a', border: '1px solid #222', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00d4ff' }}>{stat.value}</div>
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask your question..." disabled={loading} style={{ width: '100%', minHeight: '120px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '1rem', padding: '16px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
          <button onClick={handleAsk} disabled={loading || !question.trim()} style={{ width: '100%', padding: '14px', background: loading ? '#333' : 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', borderRadius: '12px', color: '#000', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : 'Ask · $0.001 USDC'}
          </button>
        </div>
        {error && <div style={{ background: '#1a0a0a', border: '1px solid #ff4444', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#ff6666' }}>{error}</div>}
        {answer && (
          <div style={{ background: '#13131a', border: '1px solid #00d4ff33', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ color: '#00d4ff', fontWeight: 700, marginBottom: '12px' }}>NanoAI Answer</div>
            <div style={{ color: '#ddd', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{answer}</div>
          </div>
        )}
        {/* Margin Calculator */}
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontWeight: 700, marginBottom: '16px', color: '#888' }}>Margin Calculator</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Cost ($)</label>
              <input type="number" value={marginCost} onChange={e => setMarginCost(e.target.value)} placeholder="0.00" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Revenue ($)</label>
              <input type="number" value={marginRevenue} onChange={e => setMarginRevenue(e.target.value)} placeholder="0.00" style={{ width: '100%', background: '#0a0a0f', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          {marginCost && marginRevenue && (() => {
            const cost = parseFloat(marginCost), rev = parseFloat(marginRevenue)
            const profit = rev - cost
            const margin = rev !== 0 ? ((profit / rev) * 100).toFixed(2) : 0
            const positive = profit >= 0
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[{ label: 'Profit', value: `$${profit.toFixed(4)}`, good: positive }, { label: 'Margin', value: `${margin}%`, good: positive }, { label: 'ROI', value: `${cost !== 0 ? ((profit / cost) * 100).toFixed(1) : 0}%`, good: positive }].map(r => (
                  <div key={r.label} style={{ background: '#0a0a0f', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: r.good ? '#00d4ff' : '#ff6666' }}>{r.value}</div>
                    <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '4px' }}>{r.label}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {txHistory.length > 0 && (
          <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px' }}>
            <div style={{ fontWeight: 700, marginBottom: '16px', color: '#888' }}>Transaction History ({txHistory.length})</div>
            {txHistory.map(tx => (
              <div key={tx.id} style={{ padding: '12px', background: '#0a0a0f', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#fff' }}>{tx.question}</span>
                  <span style={{ color: '#00d4ff', fontWeight: 700 }}>$0.001 USDC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555' }}>{tx.time} · {tx.tokens} tokens</span>
                  <a href={'https://testnet.arcscan.app/tx/' + tx.txHash} target="_blank" rel="noreferrer" style={{ color: '#0099cc', fontSize: '0.8rem' }}>{tx.txHash.slice(0,10)}...</a>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', color: '#888', fontSize: '0.85rem', marginTop: '12px' }}>Total: ${(txHistory.length * 0.001).toFixed(3)} USDC</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App