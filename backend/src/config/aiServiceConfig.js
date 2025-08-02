require('dotenv').config();
const baseUrl = process.env.AI_SERVICE_BASE_URL;
const aiConfig = {
    urls: {
        process: `${baseUrl}${process.env.AI_SERVICE_PROCESS_ENDPOINT}`,
        ask: `${baseUrl}${process.env.AI_SERVICE_ASK_ENDPOINT}`,
        askEmbedding: `${baseUrl}${process.env.AI_SERVICE_EMBEDDING_ENDPOINT}`,
        pendencies: `${baseUrl}${process.env.AI_SERVICE_PENDENCIES_ENDPOINT}`,
    }
};

module.exports = aiConfig;