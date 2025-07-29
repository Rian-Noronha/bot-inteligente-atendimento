const { createClient } = require('redis');

const redisClient = createClient({
    url: 'redis://10.0.0.112:6379'
});

redisClient.on('connect', () => {
    console.log('Conectado ao Redis com sucesso!');
});

redisClient.on('error', (err) => {
    console.error('Erro na conexão com o Redis:', err);
});

(async () => {
    await redisClient.connect();
})();


module.exports = redisClient;