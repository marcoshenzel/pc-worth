# 🤖 PC Worth: Assistente Inteligente de Configuração de PC (Estático)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Este projeto simula um assistente de inteligência artificial focado em guiar o usuário na **configuração e avaliação de preço de um setup de computador**, seja para montar um PC do zero ou para precificar um hardware existente para revenda.

O projeto é construído em uma arquitetura **100% estática** (Front-end puro), ideal para hospedagem no GitHub Pages, utilizando simulações para demonstrar a complexidade de um sistema real de IA.

## ✨ Funcionalidades

O sistema opera em um fluxo de duas etapas:

### 1. Chat de Setup (index.html)

* **Validação de Localização:** O chat inicia perguntando a localização do usuário (cidade/estado) e usa a **API pública do IBGE** para validar a entrada.
* **Base de Conhecimento:** Prioriza a busca de peças em uma **base de dados estática (`data.json`)** para fornecer informações mais precisas e agilizar o processo.
* **Simulação de IA:** Se a peça não for encontrada na base estática, simula a ação de um modelo de IA (Gemini) para estimar um **preço mínimo e máximo** e categorizar o componente.
* **Persistência de Sessão:** A lista de peças criada é salva temporariamente no `localStorage` do navegador para ser transferida para a tela de gerenciamento.

### 2. Gerenciamento de Lista (lista.html)

* **Avaliação Financeira:** Calcula o **Valor Atual de Mercado** (média dos preços min/max) e a **Estimativa de Preço de Revenda** (80% do valor de mercado) do setup completo.
* **CRUD Estático:** Permite que o usuário realize operações de **Adicionar, Editar e Excluir (CRUD)** peças através de um formulário manual.
* **Persistência de Dados:** Toda a lista é salva no **`localStorage`**, garantindo que os dados permaneçam na sessão do usuário, mesmo após recarregar a página.

## 🛠️ Tecnologias Utilizadas

Este projeto foi desenvolvido com foco na simplicidade e na capacidade de ser hospedado como um aplicativo web estático:

| Componente | Tecnologia | Uso |
| :--- | :--- | :--- |
| **Linguagem** | JavaScript | Lógica de estado, simulação de IA, CRUD e manipulação do DOM. |
| **Persistência** | `localStorage` | Armazenamento temporário da lista de peças no navegador do usuário. |
| **Dados** | `data.json` | Base de conhecimento inicial e estática para precificação de peças. |
| **Validação** | API do IBGE | Validação pública e em tempo real da localização (cidades/estados). |

## 🚀 Como Visualizar

Este projeto pode ser visualizado diretamente no seu navegador, sem a necessidade de um servidor Node.js ou de instalação de dependências.

### 1. Usando o GitHub Pages (Recomendado)

O projeto já está configurado para o GitHub Pages.

1.  Acesse o link: `https://marcoshenzel.github.io/pc-worth/`
2.  O fluxo de chat iniciará na página `index.html`.

### 2. Execução Local (Alternativa)

Se você clonar o repositório, pode abri-lo localmente (sem a necessidade de instalar Node.js ou dependências):

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/marcoshenzel/pc-worth.git](https://github.com/marcoshenzel/pc-worth.git)
    ```
2.  Navegue até a pasta:
    ```bash
    cd pc-worth
    ```
3.  Abra o arquivo **`index.html`** diretamente no seu navegador.

**Nota:** Devido às restrições de segurança do navegador (CORS/Same-Origin Policy), você pode encontrar problemas ao tentar carregar o `data.json` ou a API do IBGE ao abrir o arquivo diretamente no Chrome/Firefox. Se isso ocorrer, use a hospedagem do GitHub Pages ou execute um servidor local simples (ex: `python3 -m http.server` ou a extensão **Live Server** no VS Code).

---

---

## 💡 Próximos Passos e Visão de Futuro

Esta aplicação, em sua versão atual (estática no GitHub Pages), serve como um **MVP (Produto Mínimo Viável) para demonstrar a lógica e o fluxo de dados** do sistema. A versão completa e final terá uma arquitetura **dinâmica (Back-end)** com as seguintes integrações e objetivos:

### 🚀 Metas de Desenvolvimento (Próxima Fase)

* **Autenticação de Usuário:** Implementar um sistema robusto de **Login e Cadastro** para que os usuários possam acessar suas listas de setups de PC de qualquer dispositivo. Isso será feito utilizando o **MongoDB** para persistência de dados do usuário e tecnologias como **JWT (JSON Web Tokens)** para segurança das sessões.
* **Inteligência Real com Gemini:** Substituir a simulação estática pela integração direta com a API do **Gemini 2.5 (ou superior)**. Isso permitirá que o chatbot compreenda comandos complexos, faça inferências precisas sobre peças e gere a lista de componentes com lógica de IA avançada.
* **Precificação Assertiva:** Integrar a busca do Gemini com o **Google Search** ou ferramentas de busca de e-commerce especializadas. O objetivo é fornecer **links diretos e preços atualizados** de produtos em lojas parceiras (como Kabum, Pichau e Amazon), tornando a precificação muito mais assertiva e útil.
* **Persistência de Dados Profissional:** Migrar o armazenamento de dados do `localStorage` para o **MongoDB Atlas**, permitindo que os usuários salvem suas configurações de PC e as acessem de qualquer dispositivo.

### 🌐 Arquitetura de Deploy (Projeto Futuro)

A aplicação futura exigirá um ambiente de hospedagem que suporte a execução do código de Back-end (Node.js) e a comunicação segura com chaves de API.

| Camada | Tecnologia Principal | Hospedagem Sugerida | Objetivo |
| :--- | :--- | :--- | :--- |
| **Front-end** | HTML/JS/CSS | **GitHub Pages** ou Vercel/Netlify | Interface do usuário e lógica de apresentação. |
| **Back-end** | Node.js/Express | **Railway / Render** | Servir as rotas da API, proteger a chave do Gemini e gerenciar o MongoDB. |
| **Banco de Dados**| MongoDB Atlas | Nuvem Dedicada | Armazenamento persistente e escalável da lista de peças. |

---

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tiver sugestões para melhorar a simulação, adicionar mais dados ao `data.json`, ou aprimorar a interface, sinta-se à vontade para abrir uma *Issue* ou enviar um *Pull Request*.

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
