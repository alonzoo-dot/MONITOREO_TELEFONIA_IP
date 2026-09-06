import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  obtenerFotoActual,
  obtenerResumen,
  obtenerTendencia,
  descargarReporteEstadisticas,
} from '../services/estadistica.service';
import type {
  RespuestaFotoActual,
  RespuestaResumen,
  RespuestaTendencia,
  Granularidad,
} from '../types/estadistica';
import TarjetasFotoActual from '../components/estadisticas/TarjetasFotoActual';
import GraficaTendencia from '../components/estadisticas/GraficaTendencia';
import GraficaTopDispositivos from '../components/estadisticas/GraficaTopDispositivos';
import GraficaDistribucionBarras from '../components/estadisticas/GraficaDistribucionBarras';
import GraficaDistribucionModelo from '../components/estadisticas/GraficaDistribucionModelo';
import TarjetaTiempoAtencion from '../components/estadisticas/TarjetaTiempoAtencion';
import { COLOR_PISO, COLOR_TIPO } from '../components/estadisticas/coloresGraficas';
import estilos from './Estadisticas.module.css';

// Formatea una fecha a YYYY-MM-DD
function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Formatea un ISO a fecha y hora local legible en es-MX
function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return fecha
    .toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}

// Calcula el rango inicial de los ultimos 30 dias
function calcularRangoInicial(): { desde: string; hasta: string } {
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hoy.getDate() - 30);
  return { desde: formatearFecha(hace30), hasta: formatearFecha(hoy) };
}

function Estadisticas() {
  const rangoInicial = calcularRangoInicial();
  const [desde, setDesde] = useState(rangoInicial.desde);
  const [hasta, setHasta] = useState(rangoInicial.hasta);
  const [granularidad, setGranularidad] = useState<Granularidad>('dia');

  const [fotoActual, setFotoActual] = useState<RespuestaFotoActual | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState(false);

  const [resumen, setResumen] = useState<RespuestaResumen | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState(false);

  const [tendencia, setTendencia] = useState<RespuestaTendencia | null>(null);
  const [cargandoTendencia, setCargandoTendencia] = useState(false);
  const [errorTendencia, setErrorTendencia] = useState(false);

  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState(false);

  const cargarFotoActual = useCallback(async () => {
    setCargandoFoto(true);
    setErrorFoto(false);
    try {
      const datos = await obtenerFotoActual();
      setFotoActual(datos);
    } catch {
      setErrorFoto(true);
    } finally {
      setCargandoFoto(false);
    }
  }, []);

  const cargarResumen = useCallback(async () => {
    setCargandoResumen(true);
    setErrorResumen(false);
    try {
      const datos = await obtenerResumen(desde, hasta);
      setResumen(datos);
    } catch {
      setErrorResumen(true);
    } finally {
      setCargandoResumen(false);
    }
  }, [desde, hasta]);

  const cargarTendencia = useCallback(async () => {
    setCargandoTendencia(true);
    setErrorTendencia(false);
    try {
      const datos = await obtenerTendencia(desde, hasta, granularidad);
      setTendencia(datos);
    } catch {
      setErrorTendencia(true);
    } finally {
      setCargandoTendencia(false);
    }
  }, [desde, hasta, granularidad]);

  // La foto actual se carga una sola vez al montar
  useEffect(() => {
    cargarFotoActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambios en desde u hasta recargan resumen y tendencia
  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    cargarTendencia();
  }, [cargarTendencia]);

  // Descarga el reporte PDF con el rango de fechas actual
  async function generarReporte() {
    setGenerandoReporte(true);
    setErrorReporte(false);
    try {
      await descargarReporteEstadisticas(desde || undefined, hasta || undefined);
    } catch {
      setErrorReporte(true);
    } finally {
      setGenerandoReporte(false);
    }
  }

  return (
    <Layout>
      <div className={estilos.encabezado}>
        <h1>Estadisticas</h1>
      </div>

      <div className={estilos.filtros}>
        <label className={estilos.campo}>
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className={estilos.campo}>
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label className={estilos.campo}>
          Granularidad
          <select
            value={granularidad}
            onChange={(e) => setGranularidad(e.target.value as Granularidad)}
          >
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </label>

        <button
          className={estilos.btnReporte}
          onClick={generarReporte}
          disabled={generandoReporte}
          title="Descargar reporte PDF con el rango actual"
        >
          {generandoReporte ? 'Generando...' : 'Descargar reporte PDF'}
        </button>
      </div>

      {errorReporte && <p className={estilos.avisoReporte}>No se pudo generar el reporte.</p>}

      <section className={estilos.filaSuperior}>
        <div className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Foto actual</h2>
          {cargandoFoto ? (
            <p className={estilos.aviso}>Cargando...</p>
          ) : errorFoto ? (
            <p className={estilos.aviso}>
              No se pudo cargar la foto actual.
              <button className={estilos.btnReintentar} onClick={cargarFotoActual}>
                Reintentar
              </button>
            </p>
          ) : fotoActual ? (
            <>
              <p className={estilos.subtitulo}>
                Actualizado: {formatearFechaHora(fotoActual.generadoEn)}
              </p>
              <TarjetasFotoActual foto={fotoActual} />
            </>
          ) : null}
        </div>

        <div className={estilos.tarjeta}>
          <h2 className={estilos.tituloSeccion}>Tiempo de atencion</h2>
          {cargandoResumen ? (
            <p className={estilos.aviso}>Cargando...</p>
          ) : errorResumen ? (
            <p className={estilos.aviso}>
              No se pudo cargar el resumen.
              <button className={estilos.btnReintentar} onClick={cargarResumen}>
                Reintentar
              </button>
            </p>
          ) : resumen ? (
            <TarjetaTiempoAtencion tiempo={resumen.tiempoAtencion} />
          ) : null}
        </div>
      </section>

      <section className={`${estilos.tarjeta} ${estilos.tendencia}`}>
        <h2 className={estilos.tituloSeccion}>Tendencia</h2>
        {cargandoTendencia ? (
          <p className={estilos.aviso}>Cargando...</p>
        ) : errorTendencia ? (
          <p className={estilos.aviso}>
            No se pudo cargar la tendencia.
            <button className={estilos.btnReintentar} onClick={cargarTendencia}>
              Reintentar
            </button>
          </p>
        ) : tendencia ? (
          <GraficaTendencia puntos={tendencia.puntos} />
        ) : null}
      </section>

      <section className={estilos.seccion}>
        {cargandoResumen ? (
          <p className={estilos.aviso}>Cargando...</p>
        ) : errorResumen ? (
          <p className={estilos.aviso}>
            No se pudo cargar el resumen.
            <button className={estilos.btnReintentar} onClick={cargarResumen}>
              Reintentar
            </button>
          </p>
        ) : resumen ? (
          <div className={estilos.cuadricula}>
            <div className={estilos.tarjeta}>
              <h3 className={estilos.subtitulo}>Top dispositivos</h3>
              <GraficaTopDispositivos datos={resumen.topDispositivos} />
            </div>

            <div className={estilos.tarjeta}>
              <h3 className={estilos.subtitulo}>Distribucion por piso</h3>
              <GraficaDistribucionBarras
                datos={resumen.distribucionPiso.map((fila) => ({
                  etiqueta: fila.piso,
                  caidas: fila.caidas,
                }))}
                nombreEje="Piso"
                color={COLOR_PISO}
              />
            </div>

            <div className={estilos.tarjeta}>
              <h3 className={estilos.subtitulo}>Distribucion por modelo</h3>
              <GraficaDistribucionModelo datos={resumen.distribucionModelo} />
            </div>

            <div className={estilos.tarjeta}>
              <h3 className={estilos.subtitulo}>Distribucion por tipo de ubicacion</h3>
              <GraficaDistribucionBarras
                datos={resumen.distribucionTipoUbicacion.map((fila) => ({
                  etiqueta: fila.tipoUbicacion,
                  caidas: fila.caidas,
                }))}
                nombreEje="Tipo de ubicacion"
                color={COLOR_TIPO}
              />
            </div>

            <div className={`${estilos.tarjeta} ${estilos.cuadriculaAncha}`}>
              <h3 className={estilos.subtitulo}>Carga por usuario</h3>
              {resumen.cargaUsuarios.length === 0 ? (
                <p className={estilos.aviso}>Sin datos en el periodo</p>
              ) : (
                <table className={estilos.tabla}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Atendidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.cargaUsuarios.map((fila) => (
                      <tr key={fila.idUsuario}>
                        <td>{fila.usuario}</td>
                        <td>{fila.atendidas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

export default Estadisticas;
