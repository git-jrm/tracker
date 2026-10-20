import { copyUserItems } from './copy-user-items.js';

const [sourceUser, destinationUser, ...extraArgs] = process.argv.slice(2);

if (!sourceUser || !destinationUser || extraArgs.length > 0) {
    console.error('Uso: pnpm run user:copy-catalog <usuarioOrigen> <usuarioDestino>');
    process.exitCode = 1;
} else {
    try {
        await copyUserItems(sourceUser, destinationUser, 'CATALOG#', 'catálogo');
    } catch (error) {
        console.error(`No se copió el catálogo: ${error.message}`);
        process.exitCode = 1;
    }
}
