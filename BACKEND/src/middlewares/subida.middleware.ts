import multer from 'multer';

/**
 * Middleware de subida de archivos para la importación de inventario.
 * Guarda el archivo en memoria (buffer), limita el tamaño y acepta solo .xlsx.
 */
const almacenamiento = multer.memoryStorage();

export const subirExcel = multer({
  storage: almacenamiento,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (_peticion, archivo, callback) => {
    const esXlsx =
      archivo.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      archivo.originalname.toLowerCase().endsWith('.xlsx');
    if (esXlsx) {
      callback(null, true);
    } else {
      callback(new Error('Solo se permiten archivos .xlsx'));
    }
  },
}).single('archivo');