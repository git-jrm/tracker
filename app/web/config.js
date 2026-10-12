// Estas URLs son públicas: el navegador las necesita para llamar a la API.
// El secreto JWT nunca debe incluirse en este archivo.
window.TRACKER_CONFIG = Object.freeze({
	local: 'http://localhost:3000/v1',
	aws: 'https://2yvrc35ktwnbmq4vhds54l3ua40bvluj.lambda-url.us-east-1.on.aws/v1'
});
