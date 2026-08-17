import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import DrawerDispositivo from '../components/DrawerDispositivo';
import DrawerImportar from '../components/DrawerImportar';
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
  const [todos, setTodos] = useState<Dispositivo[]>([]);
  const [modelos, setModelos] = useState<ModeloTelefono[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Estado del drawer: undefined = cerrado, null = alta, objeto = edición
  const [drawer, setDrawer] = useState<Dispositivo | null | undefined>(undefined);
  const [importarAbierto, setImportarAbierto] = useState(false);

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

  // Carga TODOS los dispositivos (sin filtros) solo para los conteos del resumen
  useEffect(() => {
    listarDispositivos({})
      .then(setTodos)
      .catch(() => setTodos([]));
  }, []);

  // Pisos disponibles a partir de los datos cargados
  const pisos = useMemo(() => {
    const set = new Set(dispositivos.map((d) => d.piso));
    return [...set].sort((a, b) => a - b);
  }, [dispositivos]);

  // Conteos para las tarjetas de resumen (sobre todos los dispositivos)
  const resumen = useMemo(
    () => ({
      activos: todos.filter((d) => d.activo).length,
      ata: todos.filter((d) => d.tipo === 'IP_ATA').length,
      ip: todos.filter((d) => d.tipo === 'IP_NATIVO').length,
      analogo: todos.filter((d) => d.tipo === 'ANALOGICO').length,
    }),
    [todos],
  );

  async function alternarActivo(d: Dispositivo) {
    try {
      if (d.activo) {
        await desactivarDispositivo(d.id_telefono);
      } else {
        await reactivarDispositivo(d.id_telefono);
      }
      cargar();
      recargarResumen();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
    }
  }

  /** Recarga los conteos del resumen (todos los dispositivos, sin filtros). */
  function recargarResumen() {
    listarDispositivos({})
      .then(setTodos)
      .catch(() => setTodos([]));
  }

  /** Tras guardar en el drawer: cierra y recarga la lista y el resumen. */
  function alGuardar() {
    setDrawer(undefined);
    cargar();
    recargarResumen();
  }

  return (
    <Layout>
      <div className={estilos.tarjetas}>
        <div className={estilos.tarjeta}>
          <span className={`${estilos.tarjetaIcono} ${estilos.tiActivos}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
          </span>
          <div>
            <div className={estilos.tarjetaNum}>{resumen.activos}</div>
            <div className={estilos.tarjetaLbl}>activos</div>
          </div>
        </div>

        <div className={estilos.tarjeta}>
          <span className={`${estilos.tarjetaIcono} ${estilos.tiAta}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6v6H9zM4 12h2M18 12h2M12 4v2M12 18v2" />
            </svg>
          </span>
          <div>
            <div className={estilos.tarjetaNum}>{resumen.ata}</div>
            <div className={estilos.tarjetaLbl}>tipo Ata</div>
          </div>
        </div>

        <div className={estilos.tarjeta}>
          <span className={`${estilos.tarjetaIcono} ${estilos.tiIp}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          </span>
          <div>
            <div className={estilos.tarjetaNum}>{resumen.ip}</div>
            <div className={estilos.tarjetaLbl}>tipo Ip</div>
          </div>
        </div>

        <div className={estilos.tarjeta}>
          <span className={`${estilos.tarjetaIcono} ${estilos.tiAnalogo}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
          <div>
            <div className={estilos.tarjetaNum}>{resumen.analogo}</div>
            <div className={estilos.tarjetaLbl}>análogos</div>
          </div>
        </div>
      </div>

      <div className={estilos.head}>
        <h1>Inventario</h1>
      </div>

      <div className={estilos.actionbar}>
        <button className={estilos.btnSec} onClick={() => setImportarAbierto(true)}>
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

      <DrawerImportar
        abierto={importarAbierto}
        onCerrar={() => setImportarAbierto(false)}
        onImportado={() => {
          cargar();
          recargarResumen();
        }}
      />
    </Layout>
  );
}

export default Inventario;
