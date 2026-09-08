import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DrawerCatalogo from '../components/DrawerCatalogo';
import {
  listarModelosTelefono,
  listarModelosAta,
  listarDepartamentos,
} from '../services/inventario.service';
import type { ModeloTelefono, ModeloAta, Departamento } from '../types/inventario';
import { esAdministrador } from '../services/sesion';
import estilos from './Catalogos.module.css';

type Pestana = 'telefono' | 'ata' | 'departamento';

/** Edición en curso: el tipo de catálogo y el registro (null = alta). */
export interface EdicionCatalogo {
  tipo: Pestana;
  registro: ModeloTelefono | ModeloAta | Departamento | null;
}

function Catalogos() {
  // Solo el ADMINISTRADOR ve los controles de escritura. El TECNICO consulta en solo lectura.
  const puedeEscribir = esAdministrador();
  const [pestana, setPestana] = useState<Pestana>('telefono');

  const [modelosTel, setModelosTel] = useState<ModeloTelefono[]>([]);
  const [modelosAta, setModelosAta] = useState<ModeloAta[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [error, setError] = useState('');

  // Drawer: undefined = cerrado
  const [edicion, setEdicion] = useState<EdicionCatalogo | undefined>(undefined);

  async function cargar() {
    setError('');
    try {
      const [t, a, d] = await Promise.all([
        listarModelosTelefono(),
        listarModelosAta(),
        listarDepartamentos(),
      ]);
      setModelosTel(t);
      setModelosAta(a);
      setDepartamentos(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los catálogos');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function alGuardar() {
    setEdicion(undefined);
    cargar();
  }

  const pestanas: { clave: Pestana; texto: string }[] = [
    { clave: 'telefono', texto: 'Modelos de teléfono' },
    { clave: 'ata', texto: 'Modelos de ATA' },
    { clave: 'departamento', texto: 'Departamentos' },
  ];

  return (
    <Layout>
      <div className={estilos.head}>
        <h1>Catálogos</h1>
        {puedeEscribir && (
          <button
            className={estilos.btnPri}
            onClick={() => setEdicion({ tipo: pestana, registro: null })}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo
          </button>
        )}
      </div>

      <div className={estilos.tabs}>
        {pestanas.map((p) => (
          <button
            key={p.clave}
            className={`${estilos.tab} ${pestana === p.clave ? estilos.tabActivo : ''}`}
            onClick={() => setPestana(p.clave)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {error && <div className={estilos.error}>{error}</div>}

      <div className={estilos.tcard}>
        {pestana === 'telefono' && (
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Marca</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {modelosTel.map((m) => (
                <tr key={m.id_modelo_telefono}>
                  <td>{m.modelo}</td>
                  <td>{m.marca}</td>
                  <td>
                    {puedeEscribir && (
                      <button
                        className={estilos.ib}
                        title="Editar"
                        onClick={() => setEdicion({ tipo: 'telefono', registro: m })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {modelosTel.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className={estilos.empty}>Sin modelos de teléfono</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {pestana === 'ata' && (
          <table>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Marca</th>
                <th>Puertos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {modelosAta.map((m) => (
                <tr key={m.id_modelo_ata}>
                  <td>{m.modelo}</td>
                  <td>{m.marca}</td>
                  <td>{m.cantidad_puertos}</td>
                  <td>
                    {puedeEscribir && (
                      <button
                        className={estilos.ib}
                        title="Editar"
                        onClick={() => setEdicion({ tipo: 'ata', registro: m })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {modelosAta.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className={estilos.empty}>Sin modelos de ATA</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {pestana === 'departamento' && (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departamentos.map((d) => (
                <tr key={d.id_departamento}>
                  <td>{d.nombre}</td>
                  <td>
                    {puedeEscribir && (
                      <button
                        className={estilos.ib}
                        title="Editar"
                        onClick={() => setEdicion({ tipo: 'departamento', registro: d })}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {departamentos.length === 0 && (
                <tr>
                  <td colSpan={2}>
                    <div className={estilos.empty}>Sin departamentos</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <DrawerCatalogo edicion={edicion} onCerrar={() => setEdicion(undefined)} onGuardado={alGuardar} />
    </Layout>
  );
}

export default Catalogos;
