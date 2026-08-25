import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientApp from './client/ClientApp.jsx';
import AdminApp from './admin/AdminApp.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<ClientApp />} />
      </Routes>
    </BrowserRouter>
  );
}
