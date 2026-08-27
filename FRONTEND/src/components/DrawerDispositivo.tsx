import { useEffect, useState } from 'react';
import {
  crearDispositivo,
  editarDispositivo,
  listarModelosTelefono,
  listarModelosAta,
  obtenerDetalle,
} from '../services/inventario.service';
import type {
  Dispositivo,
  DatosDispositivo,
  ModeloTelefono,
  ModeloAta,
  DetalleDispositivo,
} from '../types/inventario';
import type { EstadoDispositivoMonitoreo } from '../types/monitoreo';
import { formatoRelativo } from '../utils/fechas';
import { mostrarToast } from '../store/toasts';
import estilos from './DrawerDispositivo.module.css';

interface Props {
  /** Si viene un dispositivo, el drawer edita; si es null, crea. Si es undefined, está cerrado. */
  dispositivo: Dispositivo | null | undefined;
  /** Id del dispositivo a mostrar en modo detalle (solo lectura); null = ese modo está cerrado. */
  idDetalle: number | null;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ETIQUETA_TIPO: Record<string, string> = {
  IP_ATA: 'Ata',
  IP_NATIVO: 'Ip',
  ANALOGICO: 'Análogo',
};

const ETIQUETA_ESTADO: Record<EstadoDispositivoMonitoreo, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  DESCONOCIDO: 'Desconocido',
  EN_MANTENIMIENTO: 'Mantenimiento',
};

const CLASE_ESTADO: Record<EstadoDispositivoMonitoreo, string> = {
  ONLINE: 'stOnline',
  OFFLINE: 'stOffline',
  DESCONOCIDO: 'stDesc',
  EN_MANTENIMIENTO: 'stAttn',
};

/** Estado inicial vacío del formulario (modo alta). */
const FORM_VACIO = {
  ubicacion_nombre: '',
  piso: '',
  tipo_ubicacion: 'HABITACION',
  id_modelo_telefono: '',
  extension: '',
  tipo: 'IP_ATA',
  numero_serie: '',
  mac: '',
  ip: '',
  id_modelo_ata: '',
  ata_numero_serie: '',
};

function DrawerDispositivo({ dispositivo, idDetalle, onCerrar, onGuardado }: Props) {
  const modoDetalle = idDetalle !== null;
  const abierto = modoDetalle || dispositivo !== undefined;
  const editando = dispositivo != null;

  const [form, setForm] = useState({ ...FORM_VACIO });
  const [modelosTel, setModelosTel] = useState<ModeloTelefono[]>([]);
  const [modelosAta, setModelosAta] = useState<ModeloAta[]>([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState<DetalleDispositivo | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Carga el detalle de solo lectura cuando se abre en ese modo
  useEffect(() => {
    if (idDetalle === null) {
      setDetalle(null);
      return;
    }
    let cancelado = false;
    setDetalle(null);
    setCargandoDetalle(true);
    obtenerDetalle(idDetalle)
      .then((datos) => {
        if (!cancelado) setDetalle(datos);
      })
      .catch((err) => {
        if (cancelado) return;
        mostrarToast({
          tipo: 'error',
          titulo: 'No se pudo cargar el detalle',
          mensaje: err instanceof Error ? err.message : 'Error al cargar el detalle del dispositivo',
        });
        onCerrar();
      })
      .finally(() => {
        if (!cancelado) setCargandoDetalle(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDetalle]);

  // Carga los catálogos una vez
  useEffect(() => {
    listarModelosTelefono().then(setModelosTel).catch(() => setModelosTel([]));
    listarModelosAta().then(setModelosAta).catch(() => setModelosAta([]));
  }, []);

  // Cuando cambia el dispositivo, precarga (edición) o limpia (alta)
  useEffect(() => {
    setError('');
    if (dispositivo) {
      setForm({
        ubicacion_nombre: dispositivo.ubicacion_nombre,
        piso: String(dispositivo.piso),
        tipo_ubicacion: dispositivo.tipo_ubicacion,
        id_modelo_telefono: String(dispositivo.id_modelo_telefono),
        extension: dispositivo.extension,
        tipo: dispositivo.tipo,
        numero_serie: dispositivo.numero_serie ?? '',
        mac: dispositivo.mac_efectiva ?? '',
        ip: dispositivo.ip_efectiva ?? '',
        id_modelo_ata: dispositivo.id_modelo_ata != null ? String(dispositivo.id_modelo_ata) : '',
        ata_numero_serie: dispositivo.ata_numero_serie ?? '',
      });
    } else {
      setForm({ ...FORM_VACIO });
    }
  }, [dispositivo]);

  function actualizar(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    setError('');

    // Validaciones mínimas de forma (el backend valida el resto)
    if (!form.ubicacion_nombre.trim() || !form.piso || !form.extension.trim()) {
      setError('Ubicación, piso y extensión son obligatorios.');
      return;
    }
    const piso = Number(form.piso);
    if (!Number.isInteger(piso)) {
      setError('El piso debe ser un número entero');
      return;
    }
    if (piso < 1) {
      setError('El piso debe ser mayor o igual a 1');
      return;
    }
    if (piso > 50) {
      setError('El piso no puede superar 50');
      return;
    }
    if (!form.id_modelo_telefono) {
      setError('Selecciona un modelo de teléfono.');
      return;
    }
    if (!form.numero_serie.trim()) {
      setError('El número de serie del teléfono es obligatorio.');
      return;
    }
    if (
      form.tipo === 'IP_ATA' &&
      (!form.mac.trim() || !form.ip.trim() || !form.id_modelo_ata || !form.ata_numero_serie.trim())
    ) {
      setError('Un dispositivo Ata requiere MAC, IP, modelo de ATA y número de serie de ATA.');
      return;
    }
    if (form.tipo === 'IP_NATIVO' && (!form.mac.trim() || !form.ip.trim())) {
      setError('Un dispositivo Ip requiere MAC e IP.');
      return;
    }

    const datos: DatosDispositivo = {
      ubicacion_nombre: form.ubicacion_nombre.trim(),
      piso,
      tipo_ubicacion: form.tipo_ubicacion,
      id_modelo_telefono: Number(form.id_modelo_telefono),
      extension: form.extension.trim(),
      tipo: form.tipo,
      numero_serie: form.numero_serie.trim(),
      mac: form.tipo === 'ANALOGICO' ? null : form.mac.trim() || null,
      ip: form.tipo === 'ANALOGICO' ? null : form.ip.trim() || null,
      id_modelo_ata: form.tipo === 'IP_ATA' ? Number(form.id_modelo_ata) : null,
      ata_numero_serie: form.tipo === 'IP_ATA' ? form.ata_numero_serie.trim() || null : null,
    };

    setGuardando(true);
    try {
      if (editando && dispositivo) {
        await editarDispositivo(dispositivo.id_telefono, datos);
      } else {
        await crearDispositivo(datos);
      }
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el dispositivo');
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
          <h2>
            {modoDetalle
              ? 'Detalle del dispositivo'
              : editando
                ? 'Editar dispositivo'
                : 'Nuevo dispositivo'}
          </h2>
          <button className={estilos.dx} onClick={onCerrar} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div className={estilos.dbody}>
          {modoDetalle ? (
            cargandoDetalle || !detalle ? (
              <div className={estilos.cargando}>Cargando…</div>
            ) : (
              <>
                <div className={estilos.field}>
                  <label>Ubicación</label>
                  <input value={detalle.ubicacion_nombre} disabled />
                </div>

                <div className={estilos.fila}>
                  <div className={estilos.field}>
                    <label>Piso</label>
                    <input value={String(detalle.piso)} disabled />
                  </div>
                  <div className={estilos.field}>
                    <label>Tipo de ubicación</label>
                    <input
                      value={detalle.tipo_ubicacion === 'HABITACION' ? 'Habitación' : 'Departamento'}
                      disabled
                    />
                  </div>
                </div>

                <div className={estilos.field}>
                  <label>Extensión</label>
                  <input className="mono" value={detalle.extension} disabled />
                </div>

                <div className={estilos.field}>
                  <label>Tipo</label>
                  <input value={ETIQUETA_TIPO[detalle.tipo] ?? detalle.tipo} disabled />
                </div>

                <div className={estilos.field}>
                  <label>Modelo de teléfono</label>
                  <input value={`${detalle.modelo_telefono} (${detalle.marca_telefono})`} disabled />
                </div>

                {detalle.tipo !== 'ANALOGICO' && (
                  <div className={estilos.cond}>
                    <div className={estilos.clabel}>Datos de red</div>

                    {detalle.tipo === 'IP_ATA' && (
                      <div className={estilos.field}>
                        <label>Modelo de ATA</label>
                        <input
                          value={detalle.modelo_ata ? `${detalle.modelo_ata} (${detalle.marca_ata})` : '—'}
                          disabled
                        />
                      </div>
                    )}

                    <div className={estilos.field}>
                      <label>MAC</label>
                      <input className="mono" value={detalle.mac ?? '—'} disabled />
                    </div>

                    <div className={estilos.field}>
                      <label>IP</label>
                      <input className="mono" value={detalle.ip ?? '—'} disabled />
                    </div>

                    {detalle.tipo === 'IP_ATA' && (
                      <div className={estilos.field}>
                        <label>Número de serie del ATA</label>
                        <input value={detalle.ata_numero_serie ?? '—'} disabled />
                      </div>
                    )}
                  </div>
                )}

                <div className={estilos.field}>
                  <label>Número de serie del teléfono</label>
                  <input value={detalle.numero_serie} disabled />
                </div>

                <div className={estilos.field}>
                  <label>Estado del registro</label>
                  <input value={detalle.activo ? 'Activo' : 'Inactivo'} disabled />
                </div>

                {detalle.tipo !== 'ANALOGICO' && (
                  <div className={estilos.cond}>
                    <div className={estilos.clabel}>Estado de monitoreo</div>

                    <div className={estilos.field}>
                      <label>Estado actual</label>
                      {detalle.estado_monitoreo ? (
                        <span
                          className={`${estilos.stpill} ${estilos[CLASE_ESTADO[detalle.estado_monitoreo]]}`}
                        >
                          <span className={estilos.dot} />
                          {ETIQUETA_ESTADO[detalle.estado_monitoreo]}
                        </span>
                      ) : (
                        <span className={estilos.muted}>Sin datos aún</span>
                      )}
                    </div>

                    <div className={estilos.field}>
                      <label>Última conexión</label>
                      <div title={detalle.fecha_ultima_conexion ?? undefined}>
                        {formatoRelativo(detalle.fecha_ultima_conexion)}
                      </div>
                    </div>

                    <div className={estilos.field}>
                      <label>Total de incidencias</label>
                      <div>{detalle.total_incidencias} incidencias registradas</div>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            <>
          {error && <div className={estilos.error}>{error}</div>}

          <div className={estilos.field}>
            <label>
              Ubicación <span className={estilos.req}>*</span>
            </label>
            <input
              style={{ textTransform: 'uppercase' }}
              value={form.ubicacion_nombre}
              onChange={(e) => actualizar('ubicacion_nombre', e.target.value)}
            />
          </div>

          <div className={estilos.fila}>
            <div className={estilos.field}>
              <label>
                Piso <span className={estilos.req}>*</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                value={form.piso}
                onChange={(e) => actualizar('piso', e.target.value)}
              />
            </div>
            <div className={estilos.field}>
              <label>
                Tipo de ubicación <span className={estilos.req}>*</span>
              </label>
              <select
                value={form.tipo_ubicacion}
                onChange={(e) => actualizar('tipo_ubicacion', e.target.value)}
              >
                <option value="HABITACION">Habitación</option>
                <option value="DEPARTAMENTO">Departamento</option>
              </select>
            </div>
          </div>

          <div className={estilos.field}>
            <label>
              Extensión <span className={estilos.req}>*</span>
            </label>
            <input
              value={form.extension}
              onChange={(e) => actualizar('extension', e.target.value)}
            />
          </div>

          <div className={estilos.field}>
            <label>
              Tipo <span className={estilos.req}>*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => actualizar('tipo', e.target.value)}
              disabled={editando}
            >
              <option value="IP_ATA">Ata</option>
              <option value="IP_NATIVO">Ip</option>
              <option value="ANALOGICO">Análogo</option>
            </select>
            {editando && (
              <div className={estilos.hint}>El tipo no se puede cambiar. Dé de baja y cree uno nuevo.</div>
            )}
          </div>

          <div className={estilos.field}>
            <label>
              Modelo de teléfono <span className={estilos.req}>*</span>
            </label>
            <select
              value={form.id_modelo_telefono}
              onChange={(e) => actualizar('id_modelo_telefono', e.target.value)}
            >
              <option value="">Selecciona un modelo</option>
              {modelosTel.map((m) => (
                <option key={m.id_modelo_telefono} value={m.id_modelo_telefono}>
                  {m.modelo} ({m.marca})
                </option>
              ))}
            </select>
          </div>

          {/* Bloque de red: solo IP_ATA e IP_NATIVO */}
          {form.tipo !== 'ANALOGICO' && (
            <div className={estilos.cond}>
              <div className={estilos.clabel}>Datos de red</div>

              {form.tipo === 'IP_ATA' && (
                <div className={estilos.field}>
                  <label>
                    Modelo de ATA <span className={estilos.req}>*</span>
                  </label>
                  <select
                    value={form.id_modelo_ata}
                    onChange={(e) => actualizar('id_modelo_ata', e.target.value)}
                  >
                    <option value="">Selecciona un modelo</option>
                    {modelosAta.map((m) => (
                      <option key={m.id_modelo_ata} value={m.id_modelo_ata}>
                        {m.modelo} ({m.marca})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={estilos.field}>
                <label>
                  MAC <span className={estilos.req}>*</span>
                </label>
                <input
                  className="mono"
                  style={{ textTransform: 'uppercase' }}
                  value={form.mac}
                  onChange={(e) => actualizar('mac', e.target.value)}
                />
                <div className={estilos.hint}>Identificador permanente del dispositivo. Lo escribes tú.</div>
              </div>

              <div className={estilos.field}>
                <label>
                  IP <span className={estilos.req}>*</span>
                </label>
                <input
                  className="mono"
                  value={form.ip}
                  onChange={(e) => actualizar('ip', e.target.value)}
                />
                <div className={estilos.hint}>Debe pertenecer a los rangos del hotel (10.81.20.x o 10.81.21.x). Es el objetivo del ping de monitoreo.</div>
              </div>

              {form.tipo === 'IP_ATA' && (
                <div className={estilos.field}>
                  <label>
                    Número de serie del ATA <span className={estilos.req}>*</span>
                  </label>
                  <input
                    value={form.ata_numero_serie}
                    onChange={(e) => actualizar('ata_numero_serie', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className={estilos.field}>
            <label>
              Número de serie del teléfono <span className={estilos.req}>*</span>
            </label>
            <input
              value={form.numero_serie}
              onChange={(e) => actualizar('numero_serie', e.target.value)}
            />
          </div>
            </>
          )}
        </div>

        <div className={estilos.dfoot}>
          {modoDetalle ? (
            <button className={estilos.btn} onClick={onCerrar}>
              Cerrar
            </button>
          ) : (
            <>
              <button className={estilos.btn} onClick={onCerrar}>
                Cancelar
              </button>
              <button className={`${estilos.btn} ${estilos.btnPri}`} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default DrawerDispositivo;
