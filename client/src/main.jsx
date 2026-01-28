// client/src/main.jsx
// Entry point for the React application
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Find the root element in the HTML and render the React app into it
createRoot(document.getElementById('root')).render(
  // StrictMode enables additional checks and warnings during development
  <StrictMode>
    <App />
  </StrictMode>,
)
