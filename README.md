# Azure Translator CLI Tool

**Azure Translator CLI Tool** é uma ferramenta de linha de comando que utiliza o Azure Translator para traduzir arquivos JSON de idiomas. Este pacote facilita a tradução de chaves aninhadas em arquivos JSON, permitindo que você mantenha suas traduções organizadas e atualizadas.


## Funcionalidades

- Tradução automática de arquivos JSON usando a API do Azure Translator.
- Suporte para múltiplos idiomas.
- Criação automática de um arquivo de configuração com suas credenciais da API.
- Capacidade de traduzir apenas as chaves que ainda não foram traduzidas.

## Pré-requisitos

- Node.js (v12 ou superior)
- Conta do Azure com acesso ao serviço de tradução.
- Chave da API do Azure Translator e a região da API.


## Instalação

Você pode instalar o pacote globalmente usando o npm:

```bash
npm i azure-translator-cli-tool
```
    
## Uso
Execute o comando:
```bash
translate
```
Ele irá gerar o arquivo ```translator.config.js```, que conterá a seguinte estrutura:

```javascript
module.exports = {
    languages: ['en', 'es', 'fr', 'ar', 'lzh', 'ru'], 
    languageSource: './src/languages/pt.json', 
    outputDir: './src/languages', 
    azureApiKey: "YOUR_AZURE_API_KEY", 
    azureApiRegion: "YOUR_AZURE_API_REGION",
};
```

- **languages**: nele você irá preencher as linguas às quais deseja obter a tradução;
- **languageSource**: o caminho do arquivo a ser usado como base para as traduções;
- **outputDir**: o caminho da pasta onde os arquivos traduzidos serão salvos;
- **azureApiKey**: a sua chave de api da azure;
- **azureApiRegion**: a região em que sua api se encontra;

Uma vez corretamente configurado, basta executar novamente o comando ```translate```e os arquivos começarão a ser traduzidos.



## Licença

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)



## Referência

 - [Azure Translate API](https://learn.microsoft.com/en-us/azure/ai-services/translator/)
 


