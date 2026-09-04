import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { obtenerFotoActual, obtenerResumen, obtenerTendencia } from '../services/estadistica.service';
import type {
  RespuestaFotoActual,
  RespuestaResumen,
  RespuestaTendencia,
  Granularidad,
} from '../types/estadistica';

// Formatea una fecha a YYYY-MM-DD
function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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

  return (
    <Layout>
      <h1>Estadisticas</h1>

      <div>
        <label>
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <label>
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
      </div>

      <section>
        <h2>Foto actual</h2>
        {cargandoFoto ? (
          <p>Cargando...</p>
        ) : errorFoto ? (
          <p>
            No se pudo cargar la foto actual.
            <button onClick={cargarFotoActual}>Reintentar</button>
          </p>
        ) : fotoActual ? (
          <table>
            <tbody>
              <tr>
                <td>Generado en</td>
                <td>{fotoActual.generadoEn}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td>{fotoActual.total}</td>
              </tr>
              <tr>
                <td>Online</td>
                <td>{fotoActual.online}</td>
              </tr>
              <tr>
                <td>Offline</td>
                <td>{fotoActual.offline}</td>
              </tr>
              <tr>
                <td>Mantenimiento</td>
                <td>{fotoActual.mantenimiento}</td>
              </tr>
              <tr>
                <td>Desconocido</td>
                <td>{fotoActual.desconocido}</td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </section>

      <section>
        <h2>Tendencia</h2>
        {cargandoTendencia ? (
          <p>Cargando...</p>
        ) : errorTendencia ? (
          <p>
            No se pudo cargar la tendencia.
            <button onClick={cargarTendencia}>Reintentar</button>
          </p>
        ) : !tendencia || tendencia.puntos.length === 0 ? (
          <p>Sin datos en el periodo</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Caidas</th>
              </tr>
            </thead>
            <tbody>
              {tendencia.puntos.map((punto) => (
                <tr key={punto.periodo}>
                  <td>{punto.periodo}</td>
                  <td>{punto.caidas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Resumen</h2>
        {cargandoResumen ? (
          <p>Cargando...</p>
        ) : errorResumen ? (
          <p>
            No se pudo cargar el resumen.
            <button onClick={cargarResumen}>Reintentar</button>
          </p>
        ) : resumen ? (
          <>
            <h3>Top dispositivos</h3>
            {resumen.topDispositivos.length === 0 ? (
              <p>Sin datos en el periodo</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Extension</th>
                    <th>Ubicacion</th>
                    <th>Tipo de ubicacion</th>
                    <th>Caidas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.topDispositivos.map((fila) => (
                    <tr key={fila.idTelefono}>
                      <td>{fila.extension}</td>
                      <td>{fila.ubicacion}</td>
                      <td>{fila.tipoUbicacion}</td>
                      <td>{fila.caidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Distribucion por piso</h3>
            {resumen.distribucionPiso.length === 0 ? (
              <p>Sin datos en el periodo</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Piso</th>
                    <th>Caidas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.distribucionPiso.map((fila) => (
                    <tr key={fila.piso}>
                      <td>{fila.piso}</td>
                      <td>{fila.caidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Distribucion por modelo</h3>
            {resumen.distribucionModelo.length === 0 ? (
              <p>Sin datos en el periodo</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Caidas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.distribucionModelo.map((fila) => (
                    <tr key={fila.modelo}>
                      <td>{fila.modelo}</td>
                      <td>{fila.caidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Distribucion por tipo de ubicacion</h3>
            {resumen.distribucionTipoUbicacion.length === 0 ? (
              <p>Sin datos en el periodo</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Tipo de ubicacion</th>
                    <th>Caidas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.distribucionTipoUbicacion.map((fila) => (
                    <tr key={fila.tipoUbicacion}>
                      <td>{fila.tipoUbicacion}</td>
                      <td>{fila.caidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Carga por usuario</h3>
            {resumen.cargaUsuarios.length === 0 ? (
              <p>Sin datos en el periodo</p>
            ) : (
              <table>
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

            <h3>Tiempo de atencion</h3>
            <p>
              Atendidas: {resumen.tiempoAtencion.atendidas} - Promedio (min):{' '}
              {resumen.tiempoAtencion.promedioMinutos ?? '-'} - Mediana (min):{' '}
              {resumen.tiempoAtencion.medianaMinutos ?? '-'}
            </p>
          </>
        ) : null}
      </section>
    </Layout>
  );
}

export default Estadisticas;
