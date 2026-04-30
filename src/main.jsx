import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

function Root() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
)