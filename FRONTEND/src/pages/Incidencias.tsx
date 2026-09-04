import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { listarIncidencias, descargarReporteIncidencias } from '../services/incidencias.service';
import type { Incidencia, FiltrosIncidencias } from '../types/incidencia';
import estilos from './Incidencias.module.css';
import ModalAtender from '../components/ModalAtender';
import { decrementarPendientes } from '../store/pendientes';

const TAMANO_PAGINA = 50;

type RangoRapido = 'hoy' | 'semana' | 'mes' | 'todo';

// Devuelve la fecha en formato YYYY-MM-DD para usar en un input date.
function aFechaInput(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Calcula el par desde/hasta en formato input para un rango rapido.
// hasta siempre es hoy. desde varia segun el rango. todo devuelve ambos vacios.
function rangoRapidoAFechas(rango: RangoRapido): { desde: string; hasta: string } {
  if (rango === 'todo') return { desde: '', hasta: '' };
  const hoy = new Date();
  const desde = new Date(hoy);
  if (rango === 'hoy') {
    // desde y hasta el mismo dia
  } else if (rango === 'semana') {
    desde.setDate(hoy.getDate() - 7);
  } else if (rango === 'mes') {
    desde.setMonth(hoy.getMonth() - 1);
  }
  return { desde: aFechaInput(desde), hasta: aFechaInput(hoy) };
}

// Convierte una fecha input YYYY-MM-DD al ISO de inicio del dia para el filtro desde.
function inicioDelDiaISO(fechaInput: string): string | undefined {
  if (!fechaInput) return undefined;
  return new Date(`${fechaInput}T00:00:00`).toISOString();
}

// Convierte una fecha input YYYY-MM-DD al ISO de fin del dia para el filtro hasta.
function finDelDiaISO(fechaInput: string): string | undefined {
  if (!fechaInput) return undefined;
  return new Date(`${fechaInput}T23:59:59`).toISOString();
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
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tipo, setTipo] = useState<'' | 'CAIDA' | 'RECUPERACION'>('');
  const [piso, setPiso] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [parametrosUrl] = useSearchParams();
  const [soloPendientes, setSoloPendientes] = useState(parametrosUrl.get('pendientes') === '1');
  const [aAtender, setAAtender] = useState<Incidencia | null>(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);

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
  }, [desde, hasta, tipo, piso, busquedaDebounce, soloPendientes]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);
    const filtros: FiltrosIncidencias = {
      desde: inicioDelDiaISO(desde),
      hasta: finDelDiaISO(hasta),
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
  }, [desde, hasta, tipo, piso, busquedaDebounce, soloPendientes, pagina]);

  useEffect(() => {
    primerRender.current = false;
    cargar();
  }, [cargar]);

  async function generarReporte() {
    setGenerandoReporte(true);
    try {
      await descargarReporteIncidencias({
        desde: inicioDelDiaISO(desde),
        hasta: finDelDiaISO(hasta),
        tipo: tipo || undefined,
        piso: piso ? Number(piso) : undefined,
        busqueda: busquedaDebounce || undefined,
        soloPendientes: soloPendientes || undefined,
      });
    } catch {
      // Si falla no rompemos la pantalla. El usuario puede reintentar.
    } finally {
      setGenerandoReporte(false);
    }
  }

  // Determina si un rango rapido coincide con el desde/hasta actual para resaltarlo.
  function rangoActivo(r: RangoRapido): boolean {
    const objetivo = rangoRapidoAFechas(r);
    return desde === objetivo.desde && hasta === objetivo.hasta;
  }

  // Aplica un rango rapido rellenando desde/hasta.
  function aplicarRangoRapido(r: RangoRapido): void {
    const fechas = rangoRapidoAFechas(r);
    setDesde(fechas.desde);
    setHasta(fechas.hasta);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  const hayFiltrosActivos =
    desde !== '' || hasta !== '' || tipo !== '' || piso !== '' || busquedaDebounce !== '' || soloPendientes;

  return (
    <Layout>
      <header className={estilos.encabezado}>
        <h1>Historial de incidencias</h1>
        <button
          className={estilos.btnReporte}
          onClick={generarReporte}
          disabled={generandoReporte}
          title="Descargar reporte PDF con los filtros actuales"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6M9 17h6" />
          </svg>
          {generandoReporte
            ? 'Generando...'
            : soloPendientes
              ? 'Generar reporte (solo pendientes)'
              : 'Generar reporte (todo)'}
        </button>
      </header>

      <div className={estilos.filtros}>
        <div className={estilos.rangos}>
          {(['hoy', 'semana', 'mes', 'todo'] as RangoRapido[]).map((r) => (
            <button
              key={r}
              className={rangoActivo(r) ? `${estilos.chip} ${estilos.chipActivo}` : estilos.chip}
              onClick={() => aplicarRangoRapido(r)}
            >
              {r === 'hoy' ? 'Hoy' : r === 'semana' ? 'Semana' : r === 'mes' ? 'Mes' : 'Todo'}
            </button>
          ))}
        </div>

        <div className={estilos.fechas}>
          <input
            className={estilos.fecha}
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
            aria-label="Desde"
          />
          <span className={estilos.fechaSep}>-</span>
          <input
            className={estilos.fecha}
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
            aria-label="Hasta"
          />
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
    </Layout>
  );
}

export default Incidencias;
