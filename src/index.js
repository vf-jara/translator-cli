const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Função para criar o arquivo de configuração padrão, se não existir
function createDefaultConfig(configPath) {
  const defaultConfig = `
module.exports = {
  languages: ['en', 'es', 'fr', 'ar', 'lzh', 'ru'], // Idiomas padrão
  languageSource: './src/languages/pt.json', // Caminho do arquivo de origem
  outputDir: './src/languages', // Caminho do arquivo de saída
  azureApiKey: "YOUR_AZURE_API_KEY",
  azureApiRegion: "YOUR_AZURE_API_REGION",
};
  `;

  fs.writeFileSync(configPath, defaultConfig);
  console.log(`Arquivo de configuração criado em: ${configPath}`);
}

// Função para carregar o arquivo de configuração
function loadConfig() {
  const configPath = path.resolve(process.cwd(), 'translator.config.js');

  // Se o arquivo não existir, cria com valores padrão
  if (!fs.existsSync(configPath)) {
    console.log("Arquivo translator.config.js não encontrado. Criando arquivo com configuração padrão...");
    createDefaultConfig(configPath);
  }

  // Carregar o arquivo de configuração usando require
  return require(configPath);
}

const config = loadConfig();

const outputLanguages = config.languages;
const languageSource = require(path.resolve(process.cwd(), config.languageSource));
const outputDir = path.resolve(process.cwd(), config.outputDir);
const azureApiKey = config.azureApiKey;
const azureApiRegion = config.azureApiRegion;

async function translateSingle(value, desiredLanguage, retryCount = 3, delay = 1000) {
    const url = 'https://api.cognitive.microsofttranslator.com/translate';

    const params = {
        'api-version': '3.0',
        'to': desiredLanguage
    };

    const dataToTranslate = [{ text: value }];

    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            const response = await axios.post(url, dataToTranslate, {
                params: params,
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': azureApiKey,
                    'Ocp-Apim-Subscription-Region': azureApiRegion,
                }
            });

            return response.data[0].translations[0].text;
        } catch (error) {
            console.error(`Erro ao traduzir "${value}" (tentativa ${attempt} de ${retryCount}):`, error.message);
            
            if (attempt < retryCount) {
                console.log(`Tentando novamente em ${delay}ms...`);
                await sleep(delay); // Pausa antes da próxima tentativa
                delay *= 2; // Exponential backoff: aumenta o tempo de espera a cada tentativa
            } else {
                throw new Error(`Erro persistente ao tentar traduzir "${value}" após ${retryCount} tentativas.`);
            }
        }
    }
}

// Função recursiva para verificar chaves aninhadas
function findMissingKeys(source, target) {
    const missingKeys = {};

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            const sourceValue = source[key];
            const targetValue = target ? target[key] : undefined;

            if (typeof sourceValue === 'object' && !Array.isArray(sourceValue) && sourceValue !== null) {
                // Se for um objeto aninhado, busca as chaves faltantes recursivamente
                const nestedMissing = findMissingKeys(sourceValue, targetValue);
                if (Object.keys(nestedMissing).length > 0) {
                    missingKeys[key] = nestedMissing;
                }
            } else if (!targetValue) {
                // Se a chave estiver faltando, adiciona ao objeto de chaves faltantes
                missingKeys[key] = sourceValue;
            }
        }
    }

    return missingKeys;
}

async function translateAndSaveNestedObject(obj, desiredLanguage, filePath) {
    let existingTranslations = {};

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingTranslations = JSON.parse(fileContent);
    }

    // Identifica apenas as chaves faltantes
    const missingKeys = findMissingKeys(obj, existingTranslations);
    
    if (Object.keys(missingKeys).length === 0) {
        console.log(`Nenhuma chave faltante para ${desiredLanguage}`);
        return;
    }

    const translatedData = await translateNestedObject(missingKeys, desiredLanguage);

    // Mescla as traduções novas com as já existentes
    const mergedData = { ...existingTranslations, ...translatedData };

    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log(`Arquivo de tradução salvo com sucesso em ${filePath}`);
}

async function translateNestedObject(obj, desiredLanguage) {
    const translatedObj = {};

    for (const [key, value] of Object.entries(obj)) {
        console.log(`Traduzindo chave: ${key}`);
        if (typeof value === 'string') {
            translatedObj[key] = await translateSingle(value, desiredLanguage);
        } else if (Array.isArray(value)) {
            translatedObj[key] = await Promise.all(
                value.map(async (item) => (typeof item === 'string' ? await translateSingle(item, desiredLanguage) : item))
            );
        } else if (typeof value === 'object' && value !== null) {
            translatedObj[key] = await translateNestedObject(value, desiredLanguage);
        } else {
            translatedObj[key] = value;
        }
    }

    return translatedObj;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateAllKeys(desiredLanguage) {
    const sourceData =  languageSource;

    const filePath =  `${outputDir}/${desiredLanguage}.json`;

    await translateAndSaveNestedObject(sourceData, desiredLanguage, filePath);

    console.log(`✅ Todas as chaves foram traduzidas para ${desiredLanguage}.json com sucesso.`);
}

async function translateForAllLanguages() {
    for (const language of outputLanguages) {
        console.log(`🔄 Iniciando tradução para o idioma: ${language}...`);
        await translateAllKeys(language); // Tradução para cada idioma
        console.log(`✅ Tradução concluída para o idioma: ${language}.`);
    }
    console.log("🚀 Todas as traduções foram concluídas!");
}



translateForAllLanguages();
            


