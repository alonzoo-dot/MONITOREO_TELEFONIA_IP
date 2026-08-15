import { useEffect, useState } from 'react';
import {
  crearModeloTelefono,
  editarModeloTelefono,
  crearModeloAta,
  editarModeloAta,
  crearDepartamento,
  editarDepartamento,
} from '../services/inventario.service';
import type { ModeloTelefono, ModeloAta, Departamento } from '../types/inventario';
import type { EdicionCatalogo } from '../pages/Catalogos';
import estilos from './DrawerDispositivo.module.css';

interface Props {
  edicion: EdicionCatalogo | undefined;
  onCerrar: () => void;
  onGuardado: () => void;
}

const TITULOS: Record<string, string> = {
  telefono: 'modelo de teléfono',
  ata: 'modelo de ATA',
  departamento: 'departamento',
};

function DrawerCatalogo({ edicion, onCerrar, onGuardado }: Props) {
  const abierto = edicion !== undefined;
  const editando = edicion?.registro != null;

  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [puertos, setPuertos] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Precarga o limpia según el registro
  useEffect(() => {
    setError('');
    if (!edicion) return;
    const r = edicion.registro;
    if (edicion.tipo === 'telefono') {
      const m = r as ModeloTelefono | null;
      setModelo(m?.modelo ?? '');
      setMarca(m?.marca ?? '');
    } else if (edicion.tipo === 'ata') {
      const m = r as ModeloAta | null;
      setModelo(m?.modelo ?? '');
      setMarca(m?.marca ?? '');
      setPuertos(m ? String(m.cantidad_puertos) : '');
    } else {
      const d = r as Departamento | null;
      setNombre(d?.nombre ?? '');
    }
  }, [edicion]);

  async function guardar() {
    if (!edicion) return;
    setError('');

    try {
      setGuardando(true);
      if (edicion.tipo === 'telefono') {
        if (!modelo.trim() || !marca.trim()) {
          setError('Modelo y marca son obligatorios.');
          setGuardando(false);
          return;
        }
        const datos = { modelo: modelo.trim(), marca: marca.trim() };
        const r = edicion.registro as ModeloTelefono | null;
        if (r) await editarModeloTelefono(r.id_modelo_telefono, datos);
        else await crearModeloTelefono(datos);
      } else if (edicion.tipo === 'ata') {
        if (!modelo.trim() || !marca.trim() || !puertos) {
          setError('Modelo, marca y cantidad de puertos son obligatorios.');
          setGuardando(false);
          return;
        }
        if (Number(puertos) < 1) {
          setError('La cantidad de puertos debe ser mayor a cero.');
          setGuardando(false);
          return;
        }
        const datos = {
          modelo: modelo.trim(),
          marca: marca.trim(),
          cantidad_puertos: Number(puertos),
        };
        const r = edicion.registro as ModeloAta | null;
        if (r) await editarModeloAta(r.id_modelo_ata, datos);
        else await crearModeloAta(datos);
      } else {
        if (!nombre.trim()) {
          setError('El nombre es obligatorio.');
          setGuardando(false);
          return;
        }
        const datos = { nombre: nombre.trim() };
        const r = edicion.registro as Departamento | null;
        if (r) await editarDepartamento(r.id_departamento, datos);
        else await crearDepartamento(datos);
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  const titulo = edicion ? TITULOS[edicion.tipo] : '';

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
          <h2>
            {editando ? 'Editar' : 'Nuevo'} {titulo}
          </h2>
          <button className={estilos.dx} onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={estilos.dbody}>
          {error && <div className={estilos.error}>{error}</div>}

          {edicion?.tipo === 'departamento' ? (
            <div className={estilos.field}>
              <label>
                Nombre <span className={estilos.req}>*</span>
              </label>
              <input
                placeholder="Ej. Sistemas"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className={estilos.field}>
                <label>
                  Modelo <span className={estilos.req}>*</span>
                </label>
                <input
                  placeholder={edicion?.tipo === 'ata' ? 'Ej. HT802' : 'Ej. GRP2601'}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
              <div className={estilos.field}>
                <label>
                  Marca <span className={estilos.req}>*</span>
                </label>
                <input
                  placeholder="Ej. Grandstream"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </div>
              {edicion?.tipo === 'ata' && (
                <div className={estilos.field}>
                  <label>
                    Cantidad de puertos <span className={estilos.req}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 2"
                    value={puertos}
                    onChange={(e) => setPuertos(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className={estilos.dfoot}>
          <button className={estilos.btn} onClick={onCerrar}>
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

export default DrawerCatalogo;
