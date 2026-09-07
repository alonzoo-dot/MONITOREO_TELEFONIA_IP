import { useEffect, useState } from 'react';
import { crearUsuario, editarUsuario } from '../services/usuarios.service';
import { ErrorApi } from '../services/api';
import type { Usuario, TipoRol, DatosNuevoUsuario, DatosEditarUsuario } from '../types/usuario';
import estilos from './DrawerUsuario.module.css';

interface Props {
  // undefined = cerrado; null = alta; objeto Usuario = edicion
  usuario: Usuario | null | undefined;
  onCerrar: () => void;
  // Se llama tras crear o editar con exito. En alta recibe la contrasena temporal y el usuario
  // para que la pagina muestre el modal. En edicion se llama sin argumentos.
  onGuardado: (resultado?: { usuario: string; passwordTemporal: string }) => void;
}

// Convierte el tipo_rol del backend (string libre) a un TipoRol conocido.
function comoTipoRol(valor: string): TipoRol {
  return valor === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'TECNICO';
}

const FORM_VACIO = {
  nombreCompleto: '',
  usuarioLogin: '',
  rol: 'TECNICO' as TipoRol,
  activo: true,
};

function DrawerUsuario({ usuario, onCerrar, onGuardado }: Props) {
  const abierto = usuario !== undefined;
  const editando = usuario != null;

  const [form, setForm] = useState({ ...FORM_VACIO });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Cuando cambia el usuario precarga (edicion) o limpia (alta)
  useEffect(() => {
    setError('');
    if (usuario) {
      setForm({
        nombreCompleto: usuario.nombre_completo,
        usuarioLogin: usuario.usuario,
        rol: comoTipoRol(usuario.tipo_rol),
        activo: usuario.activo,
      });
    } else {
      setForm({ ...FORM_VACIO });
    }
  }, [usuario]);

  async function guardar() {
    setError('');

    const nombreCompleto = form.nombreCompleto.trim();
    const usuarioLogin = form.usuarioLogin.trim();

    if (!nombreCompleto || !usuarioLogin) {
      setError('El nombre completo y el usuario son obligatorios');
      return;
    }

    setGuardando(true);
    try {
      if (editando && usuario) {
        const datos: DatosEditarUsuario = {
          nombre_completo: nombreCompleto,
          rol: form.rol,
          activo: form.activo,
        };
        await editarUsuario(usuario.id_usuario, datos);
        onGuardado();
      } else {
        const datos: DatosNuevoUsuario = {
          usuario: usuarioLogin,
          nombre_completo: nombreCompleto,
          rol: form.rol,
        };
        const resultado = await crearUsuario(datos);
        onGuardado({ usuario: usuarioLogin, passwordTemporal: resultado.password_temporal });
      }
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(err.message);
      } else {
        setError('No se pudo guardar el usuario');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div
        className={`${estilos.scrim} ${abierto ? estilos.scrimAbierto : ''}`}
        onClick={onCerrar}
      />
      <aside
        className={`${estilos.drawer} ${abierto ? estilos.drawerAbierto : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={estilos.dhead}>
          <h2>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button className={estilos.dx} onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={estilos.dbody}>
          {error && <div className={estilos.error}>{error}</div>}

          <div className={estilos.field}>
            <label>
              Nombre completo <span className={estilos.req}>*</span>
            </label>
            <input
              value={form.nombreCompleto}
              onChange={(e) => setForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))}
            />
          </div>

          <div className={estilos.field}>
            <label>
              Usuario <span className={estilos.req}>*</span>
            </label>
            {editando ? (
              <input value={form.usuarioLogin} disabled className={estilos.soloLectura} />
            ) : (
              <input
                value={form.usuarioLogin}
                onChange={(e) => setForm((prev) => ({ ...prev, usuarioLogin: e.target.value }))}
              />
            )}
            {editando && (
              <div className={estilos.hint}>El nombre de usuario no se puede cambiar.</div>
            )}
          </div>

          <div className={estilos.field}>
            <label>Rol</label>
            <select
              value={form.rol}
              onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value as TipoRol }))}
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="TECNICO">Técnico</option>
            </select>
          </div>

          {editando ? (
            <div className={estilos.switch}>
              <span>Usuario activo</span>
              <label className={estilos.sw}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                />
                <span className={estilos.swTrack} />
              </label>
            </div>
          ) : (
            <div className={estilos.hint}>
              El sistema generará una contraseña temporal al crear el usuario.
            </div>
          )}
        </div>

        <div className={estilos.dfoot}>
          <button className={estilos.btn} onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button
            className={`${estilos.btn} ${estilos.btnPri}`}
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </aside>
    </>
  );
}

export default DrawerUsuario;
