# Painel de Parede

Assistente pessoal que roda em um tablet fixado na parede (Galaxy Tab S3) e mostra, sem precisar tocar na tela, o que importa no dia: aulas, prazos, lembretes e a hora de sair de casa.

**No ar:** https://thiagobueno5569.github.io/painel-parede/ (a página abre sem dados; cada pessoa conecta o próprio back-end).

## O que ele faz

- **Aulas do dia:** mostra a próxima aula, quanto falta para ela e o horário de sair de casa.
- **Provas e prazos:** lê os e-mails da faculdade e adiciona provas, atividades e avisos de aula ao Google Agenda automaticamente.
- **Lembretes com alerta:** avisa na hora marcada e mantém o item como pendente até ser confirmado.
- **Resumo falado:** lê o resumo do dia em voz alta no horário de acordar.
- **Modo foco:** temporizador de estudo em tela cheia.
- **Clima:** previsão do dia pela API Open-Meteo.
- **Modo noturno e descanso de tela:** tema escuro a partir das 19h e obras de arte em domínio público (The Metropolitan Museum of Art) quando o painel está ocioso.

## Como funciona

| Parte | Tecnologia |
|---|---|
| Painel | Um único arquivo `index.html` (HTML, CSS e JavaScript puros, sem dependências), hospedado no GitHub Pages |
| Back-end | Google Apps Script, que lê o Gmail e o Google Agenda e entrega os dados em JSON |
| Voz | Web Speech API (`speechSynthesis`) |
| Tela sempre ligada | Screen Wake Lock API |

O endereço do back-end e a chave de acesso são passados pela URL na primeira abertura e ficam guardados só no navegador do tablet. Nenhum dado pessoal fica neste repositório.

## Autor

Thiago Bueno da Silva, estudante de Engenharia Elétrica na UFSJ.
