# Transparent Twitch Chat

**Transparent Twitch Chat** é uma aplicação feita em javascript utilizando Electron, ela te permite visualizar o chat de um canal da Twitch (já com a extensão do 7TV) em uma janela flutuante transparente, com suporte para modo "click-through" (permitindo fixar o chat em uma posição e não clicar nele enquanto joga), sem necessidade nenhuma de se cadastrar ou fazer login na Twitch.

## Funcionalidades

- **Janela Transparente**: Ajuste a opacidade da janela do chat para que ela se misture com o ambiente.
- **Modo Click-through**: Ative ou desative o modo "click-through" para permitir que a janela fique flutuante e não interaja com o mouse.
- **Persistência de Configurações**: As configurações de posição, opacidade, nome do usuário e modo click-through são salvas localmente e restauradas ao reiniciar.
- **Compatibilidade com Twitch**: Carrega o chat de qualquer canal público da Twitch, já com a extensão 7TV.

## **Download e instalação**

**Para baixar, acesse a [aba de releases](https://github.com/MatheusFL99/transparent-twitch-chat/releases) no GitHub e escolha o tipo de instalador que deseja. Basta executar o instalador escolhido para começar a usar a aplicação.**

## Builde você mesmo, se preferir.

### Pré-requisitos

- **Node.js** e **npm** instalados.
- **Electron** como dependência do projeto.

1. **Clone o repositório**:

   ```bash
   git clone https://github.com/MatheusFL99/transparent-twitch-chat.git
   cd twitch-chat-viewer
   ```

2. **Instale as dependências**:

   ```bash
   npm install
   ```

3. **Inicie a aplicação em ambiente de desenvolvimento**:
   ```bash
   npm start
   ```

## Construindo o Executável

Para criar um executável para Windows:

1. **Instale electron-builder** globalmente:

   ```bash
   npm install -g electron-builder
   ```

2. **Build do projeto**:
   ```bash
   npm run build
   ```

O executável será gerado na pasta `dist`.
