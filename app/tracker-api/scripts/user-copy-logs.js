import { copyUserItems } from './copy-user-items.js';

const [sourceUser, destinationUser, ...extraArgs] = process.argv.slice(2);

if (!sourceUser || !destinationUser || extraArgs.length > 0) {
    console.error('Uso: pnpm run user:copy-logs <usuarioOrigen> <usuarioDestino>');
    process.exitCode = 1;
} else {
    try {
        await copyUserItems(sourceUser, destinationUser, 'LOG#', 'logs');
    } catch (error) {
        console.error(`No se copiaron los logs: ${error.message}`);
        process.exitCode = 1;
    }
}
