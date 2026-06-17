import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logVisit } from './analytics'

// Log initial site landing
logVisit('page_view')

ReactDOM.createRoot(document.getElementById('root')).render(<App />)

