const { bucket } = require('../config/firebaseAdmin');

class FirebaseStorageService {
    async deleteFileByPath(filePath) {
        if (!filePath) {
            console.warn("[Storage Service] Nenhum caminho de arquivo fornecido, pulando exclusão.");
            return;
        }

        
        console.log(`[Storage Service] Tentando acessar o arquivo com o caminho: |${filePath}|`);
       

        try {
            const file = bucket.file(filePath);
            const [exists] = await file.exists();

            if (exists) {
                await file.delete();
                console.log(`[Storage Service] Arquivo ${filePath} deletado com sucesso.`);
            } else {
                console.warn(`[Storage Service] ARQUIVO NÃO ENCONTRADO no Storage para o caminho: |${filePath}|`);
            }
        } catch (error) {
            console.error("[Storage Service] Erro ao tentar deletar arquivo:", error);
            throw new Error('Falha ao deletar o arquivo no Storage.');
        }
    }
}

module.exports = new FirebaseStorageService();