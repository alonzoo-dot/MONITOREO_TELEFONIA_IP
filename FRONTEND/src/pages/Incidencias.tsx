import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarIncidencias } from '../services/incidencias.service';
import type { Incidencia, FiltrosIncidencias } from '../types/incidencia';
import estilos from './Incidencias.module.css';
import ModalAtender from '../components/ModalAtender';
import { decrementarPendientes } from '../store/pendientes';

const TAMANO_PAGINA = 50;

type RangoRapido = 'hoy' | 'semana' | 'mes' | 'todo';

// Calcula la fecha desde segun el rango rapido elegido. Devuelve ISO o undefined para todo.
function calcularDesde(rango: RangoRapido): string | undefined {
  if (rango === 'todo') return undefined;
  const ahora = new Date();
  const desde = new Date(ahora);
  if (rango === 'hoy') desde.setHours(0, 0, 0, 0);
  if (rango === 'semana') desde.setDate(ahora.getDate() - 7);
  if (rango === 'mes') desde.setMonth(ahora.getMonth() - 1);
  return desde.toISOString();
}

// Formatea una fecha ISO a algo legible en espanol.
function formatearFecha(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()} ${hora}:${min}`;
}

function Incidencias() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  // Filtros
  const [rango, setRango] = useState<RangoRapido>('todo');
  const [tipo, setTipo] = useState<'' | 'CAIDA' | 'RECUPERACION'>('');
  const [piso, setPiso] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [parametrosUrl] = useSearchParams();
  const [soloPendientes, setSoloPendientes] = useState(parametrosUrl.get('pendientes') === '1');
  const [aAtender, setAAtender] = useState<Incidencia | null>(null);

  // Texto de busqueda con retardo para no pedir en cada tecla.
  const [busquedaDebounce, setBusquedaDebounce] = useState('');
  const primerRender = useRef(true);

  useEffect(() => {
    const id = setTimeout(() => setBusquedaDebounce(busqueda), 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  // Cualquier cambio de filtro vuelve a la pagina 1.
  useEffect(() => {
    if (primerRender.current) return;
    setPagina(1);
  }, [rango, tipo, piso, busquedaDebounce, soloPendientes]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const filtros: FiltrosIncidencias = {
      desde: calcularDesde(rango),
      tipo: tipo || undefined,
      piso: piso ? Number(piso) : undefined,
      busqueda: busquedaDebounce || undefined,
      soloPendientes: soloPendientes || undefined,
      pagina,
      tamanoPagina: TAMANO_PAGINA,
    };
    try {
      const respuesta = await listarIncidencias(filtros);
      setIncidencias(respuesta.incidencias);
      setTotal(respuesta.total);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, [rango, tipo, piso, busquedaDebounce, soloPendientes, pagina]);

  useEffect(() => {
    primerRender.current = false;
    cargar();
  }, [cargar]);

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  const hayFiltrosActivos =
    rango !== 'todo' || tipo !== '' || piso !== '' || busquedaDebounce !== '' || soloPendientes;

  return (
    <div className={estilos.pagina}>
      <header className={estilos.encabezado}>
        <h1>Historial de incidencias</h1>
        <button className={estilos.btnReporte} disabled title="Proximamente">
          Generar reporte
        </button>
      </header>

      <div className={estilos.filtros}>
        <div className={estilos.rangos}>
          {(['hoy', 'semana', 'mes', 'todo'] as RangoRapido[]).map((r) => (
            <button
              key={r}
              className={rango === r ? `${estilos.chip} ${estilos.chipActivo}` : estilos.chip}
              onClick={() => setRango(r)}
            >
              {r === 'hoy' ? 'Hoy' : r === 'semana' ? 'Semana' : r === 'mes' ? 'Mes' : 'Todo'}
            </button>
          ))}
        </div>

        <input
          className={estilos.busqueda}
          type="search"
          placeholder="Buscar por habitacion o MAC"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select className={estilos.select} value={tipo} onChange={(e) => setTipo(e.target.value as '' | 'CAIDA' | 'RECUPERACION')}>
          <option value="">Todos los tipos</option>
          <option value="CAIDA">Caidas</option>
          <option value="RECUPERACION">Recuperaciones</option>
        </select>

        <input
          className={estilos.piso}
          type="number"
          min="1"
          placeholder="Piso"
          value={piso}
          onChange={(e) => setPiso(e.target.value)}
        />

        <button
          className={soloPendientes ? `${estilos.chip} ${estilos.chipActivo}` : estilos.chip}
          onClick={() => setSoloPendientes((v) => !v)}
        >
          Solo pendientes
        </button>
      </div>

      <div className={estilos.tarjetaTabla}>
        {cargando ? (
          <div className={estilos.aviso}>Cargando incidencias...</div>
        ) : error ? (
          <div className={estilos.aviso}>
            No se pudieron cargar las incidencias.
            <button className={estilos.btnReintentar} onClick={cargar}>Reintentar</button>
          </div>
        ) : incidencias.length === 0 ? (
          <div className={estilos.aviso}>
            {hayFiltrosActivos
              ? 'No hay incidencias que coincidan con los filtros.'
              : 'Aun no se han registrado incidencias.'}
          </div>
        ) : (
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th>Fecha / hora</th>
                <th>Habitacion</th>
                <th>Piso</th>
                <th>Tipo</th>
                <th>IP registrada</th>
                <th>Atendio</th>
                <th>Observaciones</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {incidencias.map((inc) => (
                <tr key={inc.id_incidencia} className={inc.pendiente ? estilos.filaPendiente : ''}>
                  <td>{formatearFecha(inc.fecha_ocurrido)}</td>
                  <td>{inc.ubicacion_nombre}</td>
                  <td>{inc.piso}</td>
                  <td>
                    <span className={inc.tipo_evento === 'CAIDA' ? estilos.badgeCaida : estilos.badgeRecuperacion}>
                      {inc.tipo_evento === 'CAIDA' ? 'Caida' : 'Recuperacion'}
                    </span>
                  </td>
                  <td className={estilos.mono}>{inc.ip_registrada ?? '-'}</td>
                  <td>{inc.usuario_atendio ?? (inc.pendiente ? 'Pendiente' : '-')}</td>
                  <td>{inc.descripcion_falla ?? '-'}</td>
                  <td>
                    {inc.pendiente && (
                      <button className={estilos.btnAtender} onClick={() => setAAtender(inc)}>
                        Atender
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!cargando && !error && incidencias.length > 0 && (
        <div className={estilos.paginacion}>
          <span>{total} incidencias</span>
          <div className={estilos.pagControles}>
            <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
            <span>Pagina {pagina} de {totalPaginas}</span>
            <button disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
          </div>
        </div>
      )}

      {aAtender && (
        <ModalAtender
          incidencia={aAtender}
          alCerrar={() => setAAtender(null)}
          alAtender={(actualizada) => {
            setIncidencias((prev) =>
              prev.map((i) => (i.id_incidencia === actualizada.id_incidencia ? actualizada : i)),
            );
            decrementarPendientes();
            setAAtender(null);
          }}
        />
      )}
    </div>
  );
}

export default Incidencias;
