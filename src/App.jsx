import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

console.log('[Supabase] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '*** (set)' : '(not set)')

const supabase = import.meta.env.VITE_SUPABASE_URL
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null

console.log('[Supabase] client:', supabase ? 'initialized' : 'null — env vars missing')

const MODELS = {
  haiku:  { label: 'Claude Haiku',  price: 0.001, priceHex: '0x38D7EA4C68000', tag: 'Fast · Cheap' },
  sonnet: { label: 'Claude Sonnet', price: 0.002, priceHex: '0x71AFD498D0000', tag: 'Smarter · Deeper' },
}

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [model, setModel] = useState('haiku')
  const [txHistory, setTxHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nanoai_txHistory')) || [] } catch { return [] }
  })
  const [wallet, setWallet] = useState('')
  const [arcPulse, setArcPulse] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    localStorage.setItem('nanoai_txHistory', JSON.stringify(txHistory))
  }, [txHistory])

  useEffect(() => {
    const id = setInterval(() => setArcPulse(p => !p), 1200)
    return () => clearInterval(id)
  }, [])

  const fetchLeaderboard = async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('transactions')
      .select('wallet')
    if (error) { console.error('[Supabase] fetch error:', error); return }
    if (!data) return
    console.log('[Supabase] fetched rows:', data.length)
    const counts = data.reduce((acc, row) => {
      acc[row.wallet] = (acc[row.wallet] || 0) + 1
      return acc
    }, {})
    setLeaderboard(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5))
  }

  useEffect(() => { fetchLeaderboard() }, [])

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
    const selected = MODELS[model]
    try {
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: '0xCf87Ae43a6460ba1A780b9D297700784caA7c02f', value: selected.priceHex }],
      })
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/ask' : '/api/ask'
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, model }),
      })
      const data = await res.json()
      setAnswer(data.answer)
      setTxHistory(prev => [{ id: Date.now(), question: question.slice(0, 40), time: new Date().toLocaleTimeString(), tokens: data.tokens, txHash, wallet, model, price: selected.price }, ...prev])
      if (supabase) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({ wallet, tx_hash: txHash, model, price: selected.price })
        if (insertError) console.error('[Supabase] insert error:', insertError)
        else console.log('[Supabase] insert ok:', { wallet, tx_hash: txHash, model, price: selected.price })
      }
      fetchLeaderboard()
      setQuestion('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedModel = MODELS[model]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: 'system-ui' }}>


      {/* Fixed top-right: Wallet + Stats + Leaderboard */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, width: '260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Connect Wallet */}
        {!wallet
          ? <button onClick={connectWallet} style={{ width: '100%', padding: '11px 14px', background: 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>🦊 Connect Wallet</button>
          : <div style={{ padding: '11px 14px', background: '#13131a', border: '1px solid #00d4ff44', borderRadius: '12px', color: '#00d4ff', fontSize: '0.85rem' }}>✓ Connected: {wallet.slice(0,6)}...{wallet.slice(-4)}</div>
        }
        {/* Faucet + ArcScan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" style={{ padding: '9px 10px', background: '#13131a', border: '1px solid #33aa6644', borderRadius: '10px', color: '#44cc88', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', textAlign: 'center' }}>💧 Faucet</a>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ padding: '9px 10px', background: '#13131a', border: '1px solid #0099cc44', borderRadius: '10px', color: '#0099cc', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', textAlign: 'center' }}>🔗 ArcScan</a>
        </div>
        {/* Stats */}
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { label: 'Total Queries', value: txHistory.length },
            { label: 'Total Spent',   value: `$${txHistory.reduce((s, tx) => s + (tx.price || 0.001), 0).toFixed(3)}` },
            { label: 'Total Tokens',  value: txHistory.reduce((s, tx) => s + (tx.tokens || 0), 0) },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#0a0a0f', borderRadius: '8px' }}>
              <span style={{ color: '#666', fontSize: '0.8rem' }}>{stat.label}</span>
              <span style={{ color: '#00d4ff', fontWeight: 800, fontSize: '0.95rem' }}>{stat.value}</span>
            </div>
          ))}
        </div>
        {/* Leaderboard */}
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px', color: '#888', fontSize: '0.9rem' }}>🏆 Leaderboard</div>
          <div style={{ color: '#555', fontSize: '0.78rem', marginBottom: '12px' }}>Top wallets by query count</div>
          {leaderboard.length === 0
            ? <div style={{ color: '#444', fontSize: '0.82rem', textAlign: 'center', padding: '8px' }}>No queries yet</div>
            : leaderboard.map(([addr, count], i) => (
              <div key={addr} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#0a0a0f', borderRadius: '8px', marginBottom: '6px' }}>
                <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span style={{ flex: 1, color: '#aaa', fontFamily: 'monospace', fontSize: '0.8rem' }}>{addr.slice(0,6)}...{addr.slice(-4)}</span>
                <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '0.85rem' }}>{count}</span>
              </div>
            ))
          }
        </div>
      </div>


      {/* Fixed bottom-right: Built by Maje */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100, fontSize: '0.85rem', color: '#444' }}>
        Built by <a href="https://x.com/0xMaje" target="_blank" rel="noreferrer" style={{ color: '#ff8c00', textDecoration: 'none', fontWeight: 600 }}>Maje</a>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>

          <h1 style={{ fontSize: '4rem', fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff, #0099cc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 16px 0' }}>NanoAI</h1>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 16px', borderRadius: '999px',
              border: `1px solid ${arcPulse ? '#00d4ff88' : '#00d4ff33'}`,
              background: arcPulse ? '#00d4ff0a' : 'transparent',
              transition: 'all 1.2s ease',
              boxShadow: arcPulse ? '0 0 16px #00d4ff22' : 'none',
            }}>
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <span style={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.05em' }}>Powered by Arc</span>
            </div>
          </div>
          <p style={{ color: '#888', margin: '0 0 16px 0' }}>
            Every question costs <b style={{ color: '#00d4ff' }}>${selectedModel.price.toFixed(3)} USDC</b> — instant payment on Arc Testnet
          </p>
        </div>


        {/* Ask Box */}
        <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
          {/* 1. Textarea */}
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask your question..." disabled={loading} style={{ width: '100%', minHeight: '120px', background: '#0a0a0f', border: '1px solid #333', borderRadius: '12px', color: '#fff', fontSize: '1rem', padding: '16px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }} />
          {/* 2. Select Model */}
          <div style={{ background: '#0a0a0f', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
            <div style={{ color: '#555', fontSize: '0.62rem', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Model</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(MODELS).map(([key, m]) => (
                <button key={key} onClick={() => setModel(key)} style={{
                  padding: '8px 10px', background: model === key ? '#0a1a2a' : '#13131a',
                  border: `2px solid ${model === key ? '#00d4ff' : '#222'}`,
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: model === key ? '#00d4ff' : '#888', marginBottom: '2px' }}>{m.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#555', fontSize: '0.67rem' }}>{m.tag}</span>
                    <span style={{ color: model === key ? '#00d4ff' : '#555', fontWeight: 800, fontSize: '0.82rem' }}>${m.price.toFixed(3)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* 3. Ask button */}
          <button onClick={handleAsk} disabled={loading || !question.trim() || !wallet} style={{ width: '100%', padding: '14px', background: loading || !question.trim() || !wallet ? '#333' : 'linear-gradient(135deg, #00d4ff, #0099cc)', border: 'none', borderRadius: '12px', color: '#000', fontSize: '1rem', fontWeight: 700, cursor: loading || !question.trim() || !wallet ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : `Ask · $${selectedModel.price.toFixed(3)} USDC`}
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
              <div style={{ background: '#1a0a0a', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#ff6666', textAlign: 'center' }}>You pay $2.50 to send $0.001</div>
              <div style={{ marginTop: '14px' }}>
                <div style={{ height: '6px', background: '#1a0a0a', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '99.96%', height: '100%', background: '#ff4444', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: '#555' }}>
                  <span>gas</span><span>payment</span>
                </div>
              </div>
            </div>
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
              <div style={{ background: '#0a1a1a', borderRadius: '8px', padding: '10px', fontSize: '0.8rem', color: '#00d4ff', textAlign: 'center' }}>You keep $0.0006 of $0.001</div>
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

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <div style={{ background: '#13131a', border: '1px solid #222', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, marginBottom: '16px', color: '#888' }}>Transaction History ({txHistory.length})</div>
            {txHistory.map(tx => (
              <div key={tx.id} style={{ padding: '12px', background: '#0a0a0f', borderRadius: '8px', marginBottom: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#fff' }}>{tx.question}</span>
                  <span style={{ color: '#00d4ff', fontWeight: 700 }}>${(tx.price || 0.001).toFixed(3)} USDC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#555' }}>{tx.time} · {tx.tokens} tokens · {tx.model || 'haiku'}</span>
                  <a href={'https://testnet.arcscan.app/tx/' + tx.txHash} target="_blank" rel="noreferrer" style={{ color: '#0099cc', fontSize: '0.8rem' }}>{tx.txHash.slice(0,10)}...</a>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'right', color: '#888', fontSize: '0.85rem', marginTop: '12px' }}>
              Total: ${txHistory.reduce((s, tx) => s + (tx.price || 0.001), 0).toFixed(3)} USDC
            </div>
          </div>
        )}



      </div>
    </div>
  )
}

export default App
