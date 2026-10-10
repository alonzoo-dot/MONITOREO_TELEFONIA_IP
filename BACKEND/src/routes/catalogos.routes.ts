import { Router } from 'express';
import {
  listarModelosAta,
  crearModeloAta,
  editarModeloAta,
  eliminarModeloAta,
  listarModelosTelefono,
  crearModeloTelefono,
  editarModeloTelefono,
  eliminarModeloTelefono,
  listarDepartamentos,
  crearDepartamento,
  editarDepartamento,
  eliminarDepartamento,
} from '../controllers/catalogos.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';
import { validar } from '../middlewares/validacion.middleware';
import {
  esquemaModeloAta,
  esquemaModeloTelefono,
  esquemaDepartamento,
} from '../schemas/catalogo.schema';

const rutasCatalogos = Router();

// Todas las rutas de catalogos requieren token valido. El rol se aplica por endpoint.
// Lectura (GET) la pueden usar ADMINISTRADOR y TECNICO. La escritura es solo ADMINISTRADOR.
rutasCatalogos.use(requiereAutenticacion);

const permiteLectura = requiereRol('ADMINISTRADOR', 'TECNICO');
const permiteEscritura = requiereRol('ADMINISTRADOR');

// Modelos de ATA
rutasCatalogos.get('/modelos-ata', permiteLectura, listarModelosAta);
rutasCatalogos.post('/modelos-ata', permiteEscritura, validar(esquemaModeloAta), crearModeloAta);
rutasCatalogos.put('/modelos-ata/:id', permiteEscritura, validar(esquemaModeloAta), editarModeloAta);
rutasCatalogos.delete('/modelos-ata/:id', permiteEscritura, eliminarModeloAta);

// Modelos de telefono
rutasCatalogos.get('/modelos-telefono', permiteLectura, listarModelosTelefono);
rutasCatalogos.post('/modelos-telefono', permiteEscritura, validar(esquemaModeloTelefono), crearModeloTelefono);
rutasCatalogos.put('/modelos-telefono/:id', permiteEscritura, validar(esquemaModeloTelefono), editarModeloTelefono);
rutasCatalogos.delete('/modelos-telefono/:id', permiteEscritura, eliminarModeloTelefono);

// Departamentos
rutasCatalogos.get('/departamentos', permiteLectura, listarDepartamentos);
rutasCatalogos.post('/departamentos', permiteEscritura, validar(esquemaDepartamento), crearDepartamento);
rutasCatalogos.put('/departamentos/:id', permiteEscritura, validar(esquemaDepartamento), editarDepartamento);
rutasCatalogos.delete('/departamentos/:id', permiteEscritura, eliminarDepartamento);

export default rutasCatalogos;
