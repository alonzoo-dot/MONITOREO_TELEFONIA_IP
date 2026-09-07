import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import DrawerUsuario from '../components/DrawerUsuario';
import ModalPasswordTemporal from '../components/ModalPasswordTemporal';
import { listarUsuarios, resetearPassword } from '../services/usuarios.service';
import { ErrorApi } from '../services/api';
import { obtenerUsuario } from '../services/sesion';
import { confirmar } from '../store/confirmaciones';
import type { Usuario, FiltrosUsuario } from '../types/usuario';
import estilos from './Usuarios.module.css';

/** Etiqueta legible para cada rol. */
const ETIQUETA_ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  TECNICO: 'Técnico',
};

/** Estado del modal que muestra una contrasena temporal una sola vez. */
interface EstadoModalPassword {
  abierto: boolean;
  usuario: string;
  passwordTemporal: string;
  titulo: string;
}

const MODAL_PASSWORD_CERRADO: EstadoModalPassword = {
  abierto: false,
  usuario: '',
  passwordTemporal: '',
  titulo: '',
};

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Filtros aplicados en el cliente sobre la lista completa
  const [busqueda, setBusqueda] = useState('');
  const [fRol, setFRol] = useState<FiltrosUsuario['rol']>('');
  const [fEstado, setFEstado] = useState<FiltrosUsuario['estado']>('activos');

  // Estado del drawer: undefined = cerrado, null = alta, objeto = edicion
  const [drawer, setDrawer] = useState<Usuario | null | undefined>(undefined);
  const [modalPassword, setModalPassword] = useState<EstadoModalPassword>(MODAL_PASSWORD_CERRADO);

  const sesion = obtenerUsuario();
  const miId = sesion?.id_usuario ?? null;

  /** Pide la lista completa de usuarios al backend. */
  async function recargar() {
    setCargando(true);
    setError('');
    try {
      const datos = await listarUsuarios();
      setUsuarios(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  // Lista filtrada y ordenada que se muestra en la tabla
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return usuarios
      .filter((u) => {
        if (texto) {
          const coincide =
            u.nombre_completo.toLowerCase().includes(texto) ||
            u.usuario.toLowerCase().includes(texto);
          if (!coincide) return false;
        }
        if (fRol && u.tipo_rol !== fRol) return false;
        if (fEstado === 'activos' && !u.activo) return false;
        if (fEstado === 'inactivos' && u.activo) return false;
        return true;
      })
      .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [usuarios, busqueda, fRol, fEstado]);

  /** Pide confirmacion y resetea la contrasena de un usuario. */
  async function manejarResetear(u: Usuario) {
    const confirmado = await confirmar({
      titulo: 'Resetear contraseña',
      mensaje:
        'Se generará una nueva contraseña temporal para este usuario y la contraseña actual dejará de funcionar. ¿Deseas continuar?',
      variante: 'neutra',
    });
    if (!confirmado) return;

    try {
      const resultado = await resetearPassword(u.id_usuario);
      setModalPassword({
        abierto: true,
        usuario: u.usuario,
        passwordTemporal: resultado.password_temporal,
        titulo: 'Contraseña reseteada',
      });
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo resetear la contraseña');
    }
  }

  /** Tras guardar en el drawer: cierra, recarga y si fue alta abre el modal de contrasena. */
  function manejarGuardado(resultado?: { usuario: string; passwordTemporal: string }) {
    setDrawer(undefined);
    recargar();
    if (resultado) {
      setModalPassword({
        abierto: true,
        usuario: resultado.usuario,
        passwordTemporal: resultado.passwordTemporal,
        titulo: 'Usuario creado',
      });
    }
  }

  return (
    <Layout>
      <div className={estilos.head}>
        <h1>Usuarios</h1>
      </div>

      <div className={estilos.actionbar}>
        <button
          className={estilos.btnPri}
          style={{ marginLeft: 'auto' }}
          onClick={() => setDrawer(null)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      <div className={estilos.controls}>
        <div className={estilos.search}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre o usuario…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          value={fRol}
          onChange={(e) => setFRol(e.target.value as FiltrosUsuario['rol'])}
          aria-label="Rol"
        >
          <option value="">Todos los roles</option>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="TECNICO">Técnico</option>
        </select>
        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value as FiltrosUsuario['estado'])}
          aria-label="Estado"
        >
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
          <option value="todos">Todos</option>
        </select>
        <span className={estilos.rc}>
          {filtrados.length} de {usuarios.length} usuarios
        </span>
      </div>

      {error && <div className={estilos.error}>{error}</div>}

      <div className={estilos.tcard}>
        <table>
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={5}>
                  <div className={estilos.empty}>Cargando…</div>
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className={estilos.empty}>
                    <b>Sin usuarios</b>
                    Ajusta la búsqueda o los filtros.
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((u) => {
                const esYo = u.id_usuario === miId;
                return (
                  <tr key={u.id_usuario} className={u.activo ? '' : estilos.inactive}>
                    <td>
                      <span className={estilos.cardLabel}>Nombre completo</span>
                      <span className={estilos.nombre}>
                        {u.nombre_completo}
                        {esYo && <span className={estilos.tuMarca}> (tú)</span>}
                      </span>
                    </td>
                    <td>
                      <span className={estilos.cardLabel}>Usuario</span>
                      <span className="mono">{u.usuario}</span>
                    </td>
                    <td>
                      <span className={estilos.cardLabel}>Rol</span>
                      <span
                        className={`${estilos.roltag} ${
                          u.tipo_rol === 'ADMINISTRADOR' ? estilos.rolAdmin : estilos.rolTecnico
                        }`}
                      >
                        {ETIQUETA_ROL[u.tipo_rol] ?? u.tipo_rol}
                      </span>
                    </td>
                    <td>
                      <span className={estilos.cardLabel}>Estado</span>
                      <span
                        className={`${estilos.stpill} ${u.activo ? estilos.stAct : estilos.stInact}`}
                      >
                        <span className={`${estilos.dot} ${u.activo ? estilos.dotG : estilos.dotN}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={estilos.acts}>
                        <button
                          className={estilos.ib}
                          title="Editar"
                          onClick={() => setDrawer(u)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </svg>
                        </button>
                        <button
                          className={estilos.ib}
                          title="Resetear contraseña"
                          onClick={() => manejarResetear(u)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </button>
                        {u.activo && esYo ? (
                          <button
                            className={`${estilos.ib} ${estilos.ibDanger}`}
                            title="No puedes desactivar tu propia cuenta"
                            disabled
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            className={`${estilos.ib} ${u.activo ? estilos.ibDanger : estilos.ibOk}`}
                            title={u.activo ? 'Desactivar' : 'Reactivar'}
                            onClick={() => setDrawer(u)}
                          >
                            {u.activo ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DrawerUsuario
        usuario={drawer}
        onCerrar={() => setDrawer(undefined)}
        onGuardado={manejarGuardado}
      />

      <ModalPasswordTemporal
        abierto={modalPassword.abierto}
        usuario={modalPassword.usuario}
        passwordTemporal={modalPassword.passwordTemporal}
        titulo={modalPassword.titulo}
        onCerrar={() => setModalPassword(MODAL_PASSWORD_CERRADO)}
      />
    </Layout>
  );
}

export default Usuarios;
