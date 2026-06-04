import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Handle redirect from 404.html (spa redirect pattern)
(function() {
  var params = new URLSearchParams(window.location.search);
  var p = params.get('p');
  if (p) {
    var q = params.get('q');
    var path = '/trustpaws/' + p.replace(/^\//, '') + (q ? '?' + q.replace(/~and~/g, '&') : '');
    window.history.replaceState(null, '', path);
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  </React.StrictMode>
);
