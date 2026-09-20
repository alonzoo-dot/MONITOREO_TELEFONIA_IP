const path = require('path');
const { Service } = require('node-windows');

const raizBackend = path.resolve(__dirname, '..');

const svc = new Service({
  name: 'MonitoreoTelefoniaIP',
  description: 'Backend del sistema de monitoreo de telefonia IP - Hotel Dreams Aventuras.',
  script: path.join(raizBackend, 'dist', 'server.js'),
  workingDirectory: raizBackend,
  wait: 2,
  grow: 0.5,
  maxRestarts: 40,
});

svc.on('install', () => {
  console.log('[OK] Servicio instalado. Iniciandolo...');
  svc.start();
});
svc.on('alreadyinstalled', () => {
  console.log('[i] El servicio ya estaba instalado. Nada que hacer.');
});
svc.on('start', () => {
  console.log('[OK] Servicio iniciado. El backend ya corre en segundo plano.');
  console.log('     Verificacion local:  http://localhost:4000/health');
});
svc.on('error', (err) => {
  console.error('[ERROR] Fallo del servicio:', err);
});

console.log('Instalando servicio "MonitoreoTelefoniaIP"...');
svc.install();
