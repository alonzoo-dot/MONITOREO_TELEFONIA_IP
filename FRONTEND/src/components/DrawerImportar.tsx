import { useState } from 'react';
import {
  descargarPlantilla,
  importarInventario,
} from '../services/inventario.service';
import type { ReporteImportacion } from '../services/inventario.service';
import estilos from './DrawerDispositivo.module.css';
import propios from './DrawerImportar.module.css';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onImportado: () => void;
}

function DrawerImportar({ abierto, onCerrar, onImportado }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState('');
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);

  async function alDescargar() {
    setError('');
    setDescargando(true);
    try {
      await descargarPlantilla();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar la plantilla');
    } finally {
      setDescargando(false);
    }
  }

  async function alImportar() {
    if (!archivo) {
      setError('Selecciona un archivo .xlsx primero.');
      return;
    }
    setError('');
    setReporte(null);
    setImportando(true);
    try {
      const resultado = await importarInventario(archivo);
      setReporte(resultado);
      onImportado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar el archivo');
    } finally {
      setImportando(false);
    }
  }

  function cerrar() {
    setArchivo(null);
    setError('');
    setReporte(null);
    onCerrar();
  }

  return (
    <>
      <div
        className={`${estilos.scrim} ${abierto ? estilos.scrimAbierto : ''}`}
        onClick={cerrar}
      />
      <aside
        className={`${estilos.drawer} ${abierto ? estilos.drawerAbierto : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={estilos.dhead}>
          <h2>Importar desde Excel</h2>
          <button className={estilos.dx} onClick={cerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={estilos.dbody}>
          {error && <div className={estilos.error}>{error}</div>}

          {/* Paso 1: descargar plantilla */}
          <div className={propios.paso}>
            <div className={propios.pasoNum}>1</div>
            <div className={propios.pasoTexto}>
              <b>Descarga la plantilla</b>
              <p>
                Bájala, llénala con tus dispositivos y no cambies los encabezados. La segunda
                hoja lista los modelos válidos que puedes usar.
              </p>
              <button className={propios.btnSec} onClick={alDescargar} disabled={descargando}>
                {descargando ? 'Descargando…' : 'Descargar plantilla'}
              </button>
            </div>
          </div>

          {/* Paso 2: subir archivo */}
          <div className={propios.paso}>
            <div className={propios.pasoNum}>2</div>
            <div className={propios.pasoTexto}>
              <b>Sube la plantilla llena</b>
              <p>Selecciona el archivo .xlsx con los dispositivos capturados.</p>
              <input
                className={propios.file}
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setArchivo(e.target.files?.[0] ?? null);
                  setReporte(null);
                }}
              />
            </div>
          </div>

          {/* Reporte de resultados */}
          {reporte && (
            <div className={propios.reporte}>
              <div className={propios.resumen}>
                <span className={propios.creados}>{reporte.creados}</span>
                <span className={propios.total}>de {reporte.total} dispositivos creados</span>
              </div>

              {reporte.errores.length === 0 ? (
                <div className={propios.ok}>Todas las filas se importaron correctamente.</div>
              ) : (
                <div className={propios.errores}>
                  <b>{reporte.errores.length} fila(s) con error:</b>
                  <ul>
                    {reporte.errores.map((e, i) => (
                      <li key={i}>
                        <span className={propios.filaTag}>Fila {e.fila}</span>
                        {e.mensaje}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={estilos.dfoot}>
          <button className={estilos.btn} onClick={cerrar}>
            {reporte ? 'Cerrar' : 'Cancelar'}
          </button>
          {!reporte && (
            <button
              className={`${estilos.btn} ${estilos.btnPri}`}
              onClick={alImportar}
              disabled={importando || !archivo}
            >
              {importando ? 'Importando…' : 'Importar'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default DrawerImportar;
