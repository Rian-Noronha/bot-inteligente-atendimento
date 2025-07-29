const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, 'bot-atendimento-inteligente-firebase-adminsdk-fbsvc-68b6146799.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: 'bot-atendimento-inteligente.firebasestorage.app' 
    });
} catch (error) {
    if (!/already exists/u.test(error.message)) {
        console.error('Falha ao inicializar o Firebase Admin SDK:', error);
    }
}

// Pega a referência ao (bucket) de armazenamento 
const bucket = admin.storage().bucket(); 

module.exports = { admin, bucket };