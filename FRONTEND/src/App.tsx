import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CambiarPassword from './pages/CambiarPassword';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Incidencias from './pages/Incidencias';
import Catalogos from './pages/Catalogos';
import Estadisticas from './pages/Estadisticas';
import RutaProtegida from './components/RutaProtegida';
import ContenedorToasts from './components/ContenedorToasts';
import ContenedorConfirmacion from './components/ContenedorConfirmacion';

function App() {
  return (
    <BrowserRouter>
      <ContenedorToasts />
      <ContenedorConfirmacion />
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
          path="/incidencias"
          element={
            <RutaProtegida>
              <Incidencias />
            </RutaProtegida>
          }
        />
        {/* RUTA TEMPORAL DE VERIFICACION se reemplaza por el montaje definitivo en el prompt 10 */}
        <Route
          path="/estadisticas"
          element={
            <RutaProtegida>
              <Estadisticas />
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
        <Route
          path="/catalogos"
          element={
            <RutaProtegida rol="ADMINISTRADOR">
              <Catalogos />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
