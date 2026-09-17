const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'MonitoreoTelefoniaIP',
  script: path.join(path.resolve(__dirname, '..'), 'dist', 'server.js'),
});

svc.on('uninstall', () => {
  console.log('[OK] Servicio desinstalado.');
});
svc.on('stop', () => console.log('[i] Servicio detenido.'));
svc.on('error', (err) => console.error('[ERROR]', err));

console.log('Desinstalando servicio "MonitoreoTelefoniaIP"...');
svc.uninstall();
