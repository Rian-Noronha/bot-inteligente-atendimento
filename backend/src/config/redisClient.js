const { createClient } = require('redis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisUrl = `redis://${redisHost}:${redisPort}`;

const redisClient = createClient({
    url: redisUrl
});

redisClient.on('connect', () => {
    console.log(`Conectado ao Redis com sucesso em: ${redisUrl}`);
});

redisClient.on('error', (err) => {
    console.error(`Erro na conexão com o Redis em: ${redisUrl}`, err);
});

(async () => {
    await redisClient.connect();
})();


module.exports = redisClient;