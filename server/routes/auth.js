import { Router } from 'express'
import { disconnect, exchangeCode, getAuthUrl, isConnected } from '../googleAuth.js'

const router = Router()

function frontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173'
}

router.get('/google', (req, res) => {
  res.redirect(getAuthUrl())
})

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query
  if (error || !code) {
    res.redirect(`${frontendUrl()}/?google=error`)
    return
  }
  try {
    await exchangeCode(code)
    res.redirect(`${frontendUrl()}/?google=connected`)
  } catch (err) {
    console.error('Google token exchange failed:', err.message)
    res.redirect(`${frontendUrl()}/?google=error`)
  }
})

router.get('/status', (req, res) => {
  res.json({ connected: isConnected() })
})

router.post('/disconnect', (req, res) => {
  disconnect()
  res.json({ connected: false })
})

export default router
