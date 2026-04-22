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
        {/* Gas Comparison */}
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: '#888' }}>Why $0.001 Payments Need Arc</div>
          <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: '20px' }}>Gas cost vs. $0.001 payment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Ethereum */}
            <div style={{ background: '#0a0a0f', border: '1px solid #ff444433', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.2rem' }}>⟠</span>
                <span style={{ fontWeight: 700, color: '#aaa' }}>Ethereum</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '2px' }}>Gas per tx</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff6666' }}>~$2.50</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '2px' }}>Lost to gas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ff6666' }}>99.96%</div>
              </div>
              <div style={{ background: '#1a0a0a', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#ff6666', textAlign: 'center' }}>
                You pay $2.50 to send $0.001
              </div>
              {/* Loss bar */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ height: '6px', background: '#1a0a0a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '99.96%', height: '100%', background: '#ff4444', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#555' }}>
                  <span>gas</span><span>payment</span>
                </div>
              </div>
            </div>

            {/* Arc */}
            <div style={{ background: '#0a0a0f', border: '1px solid #00d4ff44', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <span style={{ fontWeight: 700, color: '#00d4ff' }}>Arc</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '2px' }}>Gas per tx</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00d4ff' }}>~$0.0004</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#555', fontSize: '0.75rem', marginBottom: '2px' }}>Margin kept</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00d4ff' }}>60%</div>
              </div>
              <div style={{ background: '#0a1a1a', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#00d4ff', textAlign: 'center' }}>
                You keep $0.0006 of $0.001
              </div>
              {/* Margin bar */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                  <div style={{ width: '40%', height: '100%', background: '#ff4444', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ width: '60%', height: '100%', background: '#00d4ff', borderRadius: '0 3px 3px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#555' }}>
                  <span>gas (40%)</span><span>margin (60%)</span>
                </div>
              </div>
            </div>
          </div>
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