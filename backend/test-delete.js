// test-delete.js
const { bucket } = require('./src/config/firebaseAdmin'); // Importa nossa configuração

//
// O caminho do arquivo que você quer testar deletar.
//
const filePathToDelete = 'documentos/1753733813248_orientacao_cartao_data_base.pdf';
//

async function testDelete() {
  console.log(`--- Iniciando teste de exclusão para: ${filePathToDelete} ---`);

  try {
    const file = bucket.file(filePathToDelete);
    const [exists] = await file.exists();

    if (exists) {
      console.log('✅ SUCESSO: Arquivo encontrado no Firebase Storage.');
      console.log('Tentando deletar...');
      await file.delete();
      console.log('✅✅ SUCESSO FINAL: Arquivo deletado com sucesso!');
    } else {
      console.error('❌ FALHA: O SDK Admin informou que o arquivo NÃO existe nesse caminho.');
    }
  } catch (error) {
    console.error('❌ FALHA CATASTRÓFICA: Ocorreu um erro durante a operação.', error);
  }
  console.log('--- Teste finalizado. ---');
}

testDelete();