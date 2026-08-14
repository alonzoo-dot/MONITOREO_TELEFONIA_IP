import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CambiarPassword from './pages/CambiarPassword';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import RutaProtegida from './components/RutaProtegida';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/cambiar-password"
          element={
            <RutaProtegida>
              <CambiarPassword />
            </RutaProtegida>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/inventario"
          element={
            <RutaProtegida rol="ADMINISTRADOR">
              <Inventario />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
