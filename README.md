# NanoAI

Pay $0.001 per question. Get an AI answer instantly. No subscriptions, no accounts — just a MetaMask wallet and a question.

NanoAI is a proof-of-concept that shows micropayments for AI access are only viable on a chain where gas costs a fraction of the payment itself. Built on **Arc Testnet** using **Circle's** infrastructure.

---

## How It Works

1. **Connect Wallet** — MetaMask connects to Arc Testnet
2. **Ask a Question** — type any question into the prompt box
3. **Pay $0.001** — a transaction for 0.001 USDC is sent on-chain before the request is processed
4. **AI Answers** — the backend calls Claude and returns the response
5. **Receipt Saved** — the transaction hash, token count, and question are stored locally and linked to ArcScan

---

## Circle Products Used

| Product | How It's Used |
|---|---|
| **Arc Testnet** | The chain where all payments are settled — ~$0.0004 gas makes $0.001 payments economically viable |
| **USDC** | Native payment token — $0.001 per query, sent peer-to-peer on-chain |
| **ArcScan** | Every transaction links directly to the ArcScan explorer for on-chain verification |

---

## Why Arc Nanopayments Matter

On Ethereum, a $0.001 payment costs ~$2.50 in gas — **99.96% of the payment is lost to fees**. The economics are impossible.

On Arc, gas is ~$0.0004 per transaction. A $0.001 payment keeps a **60% margin**. This unlocks an entirely new category of product: pay-per-use AI, APIs, content, and data — charged by the request, not the month.

NanoAI is a direct demonstration of this: no subscription tier, no free trial, no credit system. You pay exactly what you use, on-chain, instantly.

---

## Live Demo

**[nano-ai-hub.vercel.app](https://nano-ai-hub.vercel.app)**

> Requires MetaMask connected to Arc Testnet with test USDC.

---

## GitHub

**[github.com/Maje53/nano-ai-hub](https://github.com/Maje53/nano-ai-hub)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Payments | MetaMask + Arc Testnet (USDC) |
| AI Backend | Claude (Anthropic) via Express |
| Explorer | ArcScan Testnet |
| Hosting | Vercel |
| Persistence | localStorage (tx history) |
