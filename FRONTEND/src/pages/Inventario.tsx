import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import DrawerDispositivo from '../components/DrawerDispositivo';
import {
  listarDispositivos,
  listarModelosTelefono,
  desactivarDispositivo,
  reactivarDispositivo,
} from '../services/inventario.service';
import type { Dispositivo, FiltrosDispositivo, ModeloTelefono } from '../types/inventario';
import estilos from './Inventario.module.css';

/** Etiqueta legible para cada tipo de dispositivo. */
const ETIQUETA_TIPO: Record<string, string> = {
  IP_ATA: 'Ata',
  IP_NATIVO: 'Ip',
  ANALOGICO: 'Análogo',
};

function Inventario() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [modelos, setModelos] = useState<ModeloTelefono[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estado del drawer: undefined = cerrado, null = alta, objeto = edición
  const [drawer, setDrawer] = useState<Dispositivo | null | undefined>(undefined);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fPiso, setFPiso] = useState('');
  const [fModelo, setFModelo] = useState('');
  const [fEstado, setFEstado] = useState('activos');

  /** Carga la lista aplicando los filtros que maneja el backend. */
  async function cargar() {
    setCargando(true);
    setError('');
    const filtros: FiltrosDispositivo = {};
    if (fTipo) filtros.tipo = fTipo;
    if (fPiso) filtros.piso = Number(fPiso);
    if (fModelo) filtros.id_modelo_telefono = Number(fModelo);
    if (fEstado === 'activos') filtros.activo = true;
    if (fEstado === 'inactivos') filtros.activo = false;
    if (busqueda.trim()) filtros.busqueda = busqueda.trim();

    try {
      const datos = await listarDispositivos(filtros);
      setDispositivos(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los dispositivos');
    } finally {
      setCargando(false);
    }
  }

  // Recarga cuando cambian los filtros
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fTipo, fPiso, fModelo, fEstado, busqueda]);

  // Carga los modelos una vez, para el desplegable de filtro
  useEffect(() => {
    listarModelosTelefono()
      .then(setModelos)
      .catch(() => setModelos([]));
  }, []);

  // Pisos disponibles a partir de los datos cargados
  const pisos = useMemo(() => {
    const set = new Set(dispositivos.map((d) => d.piso));
    return [...set].sort((a, b) => a - b);
  }, [dispositivos]);

  async function alternarActivo(d: Dispositivo) {
    try {
      if (d.activo) {
        await desactivarDispositivo(d.id_telefono);
      } else {
        await reactivarDispositivo(d.id_telefono);
      }
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    }
  }

  /** Tras guardar en el drawer: cierra y recarga la lista. */
  function alGuardar() {
    setDrawer(undefined);
    cargar();
  }

  return (
    <Layout>
      <div className={estilos.head}>
        <h1>Inventario</h1>
      </div>

      <div className={estilos.actionbar}>
        <button className={estilos.btnSec} disabled title="Disponible próximamente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Importar desde Excel
        </button>
        <button
          className={estilos.btnPri}
          style={{ marginLeft: 'auto' }}
          onClick={() => setDrawer(null)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo dispositivo
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
            placeholder="Buscar por habitación o MAC…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select value={fTipo} onChange={(e) => setFTipo(e.target.value)} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          <option value="IP_ATA">Ata</option>
          <option value="IP_NATIVO">Ip</option>
          <option value="ANALOGICO">Análogo</option>
        </select>
        <select value={fPiso} onChange={(e) => setFPiso(e.target.value)} aria-label="Piso">
          <option value="">Todos los pisos</option>
          {pisos.map((p) => (
            <option key={p} value={p}>
              Piso {p}
            </option>
          ))}
        </select>
        <select value={fModelo} onChange={(e) => setFModelo(e.target.value)} aria-label="Modelo">
          <option value="">Todos los modelos</option>
          {modelos.map((m) => (
            <option key={m.id_modelo_telefono} value={m.id_modelo_telefono}>
              {m.modelo}
            </option>
          ))}
        </select>
        <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} aria-label="Estado">
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
          <option value="todos">Todos</option>
        </select>
        <span className={estilos.rc}>{dispositivos.length} dispositivos</span>
      </div>

      {error && <div className={estilos.error}>{error}</div>}

      <div className={estilos.tcard}>
        <table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Piso</th>
              <th>Extensión</th>
              <th>Tipo</th>
              <th>Modelo</th>
              <th>MAC</th>
              <th>IP</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={9}>
                  <div className={estilos.empty}>Cargando…</div>
                </td>
              </tr>
            ) : dispositivos.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className={estilos.empty}>
                    <b>Sin dispositivos</b>
                    Ajusta la búsqueda o los filtros.
                  </div>
                </td>
              </tr>
            ) : (
              dispositivos.map((d) => (
                <tr key={d.id_telefono} className={d.activo ? '' : estilos.inactive}>
                  <td>
                    <span className={estilos.cardLabel}>Ubicación</span>
                    <span className={estilos.hab}>{d.ubicacion_nombre}</span>
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>Piso</span>
                    {d.piso}
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>Extensión</span>
                    <span className="mono">{d.extension}</span>
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>Tipo</span>
                    <span
                      className={`${estilos.ttag} ${
                        d.tipo === 'ANALOGICO' ? estilos.ttagAn : estilos.ttagIp
                      }`}
                    >
                      {ETIQUETA_TIPO[d.tipo] ?? d.tipo}
                    </span>
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>Modelo</span>
                    <span className={estilos.modeltag}>{d.modelo_telefono}</span>
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>MAC</span>
                    {d.mac_efectiva ? (
                      <span className="mono">{d.mac_efectiva}</span>
                    ) : (
                      <span className={estilos.muted}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>IP</span>
                    {d.tipo === 'ANALOGICO' ? (
                      <span className={estilos.muted}>—</span>
                    ) : d.ata_ip ?? d.ip ? (
                      <span className="mono">{d.ata_ip ?? d.ip}</span>
                    ) : (
                      <span className={estilos.pend}>pendiente</span>
                    )}
                  </td>
                  <td>
                    <span className={estilos.cardLabel}>Estado</span>
                    <span
                      className={`${estilos.stpill} ${d.activo ? estilos.stAct : estilos.stInact}`}
                    >
                      <span
                        className={`${estilos.dot} ${d.activo ? estilos.dotG : estilos.dotN}`}
                      />
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className={estilos.acts}>
                      <button
                        className={estilos.ib}
                        title="Editar"
                        onClick={() => setDrawer(d)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button
                        className={`${estilos.ib} ${d.activo ? estilos.ibDanger : estilos.ibOk}`}
                        title={d.activo ? 'Desactivar' : 'Reactivar'}
                        onClick={() => alternarActivo(d)}
                      >
                        {d.activo ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DrawerDispositivo
        dispositivo={drawer}
        onCerrar={() => setDrawer(undefined)}
        onGuardado={alGuardar}
      />
    </Layout>
  );
}

export default Inventario;
