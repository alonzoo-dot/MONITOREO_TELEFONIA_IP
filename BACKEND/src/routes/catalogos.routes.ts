import { Router } from 'express';
import {
  listarModelosAta,
  listarModelosTelefono,
  listarDepartamentos,
} from '../controllers/catalogos.controller';
import { requiereAutenticacion } from '../middlewares/auth.middleware';
import { requiereRol } from '../middlewares/autorizacion.middleware';

const rutasCatalogos = Router();

// Todas las rutas de catálogos requieren: token válido + rol ADMINISTRADOR
rutasCatalogos.use(requiereAutenticacion);
rutasCatalogos.use(requiereRol('ADMINISTRADOR'));

rutasCatalogos.get('/modelos-ata', listarModelosAta);
rutasCatalogos.get('/modelos-telefono', listarModelosTelefono);
rutasCatalogos.get('/departamentos', listarDepartamentos);

export default rutasCatalogos;