import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/main.css'
import { decideMode } from './gpu'
import { S } from './state'
import { App } from './App'

decideMode().then(() => {
  document.documentElement.classList.toggle('poster', S.poster)
  createRoot(document.getElementById('root')!).render(<App />)
})
