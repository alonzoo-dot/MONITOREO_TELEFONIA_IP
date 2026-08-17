import { Router } from 'express';
import {
  listarModelosAta,
  crearModeloAta,
  editarModeloAta,
  listarModelosTelefono,
  crearModeloTelefono,
  editarModeloTelefono,
  listarDepartamentos,
  crearDepartamento,
  editarDepartamento,
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

// Todas las rutas de catálogos requieren: token válido + rol ADMINISTRADOR
rutasCatalogos.use(requiereAutenticacion);
rutasCatalogos.use(requiereRol('ADMINISTRADOR'));

// Modelos de ATA
rutasCatalogos.get('/modelos-ata', listarModelosAta);
rutasCatalogos.post('/modelos-ata', validar(esquemaModeloAta), crearModeloAta);
rutasCatalogos.put('/modelos-ata/:id', validar(esquemaModeloAta), editarModeloAta);

// Modelos de teléfono
rutasCatalogos.get('/modelos-telefono', listarModelosTelefono);
rutasCatalogos.post('/modelos-telefono', validar(esquemaModeloTelefono), crearModeloTelefono);
rutasCatalogos.put('/modelos-telefono/:id', validar(esquemaModeloTelefono), editarModeloTelefono);

// Departamentos
rutasCatalogos.get('/departamentos', listarDepartamentos);
rutasCatalogos.post('/departamentos', validar(esquemaDepartamento), crearDepartamento);
rutasCatalogos.put('/departamentos/:id', validar(esquemaDepartamento), editarDepartamento);

export default rutasCatalogos;
