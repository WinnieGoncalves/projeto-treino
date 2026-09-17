# Meus treinos

Aplicação pessoal em HTML, CSS e JavaScript, sem dependências externas. Requer Node.js 22 ou superior.

## Executar

    npm start

Abra http://localhost:3000. Para verificar as regras de dados: `npm test`.

Os dados ficam no localStorage do navegador, na chave `meus-treinos-v1`. São mantidos após fechar ou atualizar a página, no mesmo navegador e endereço. Limpar os dados do site remove o histórico. Celular e computador têm armazenamentos independentes.

A semana usa a data local e começa na segunda-feira. Conclusões anteriores e suas cargas são preservadas; desfazer marca o registro como desfeito, sem apagá-lo. Exercícios equivalentes usam um histórico único; alternativas têm duas cargas e duas linhas no gráfico.

Adução e Coice possuem prescrições iniciais diferentes na segunda e quinta. Antes da primeira edição, cada dia exibe o valor informado. Depois de editar, todos os dias usam a última carga compartilhada. Os valores originais da quinta permanecem visíveis como referência. A progressão começa com a carga inicial da primeira ocorrência.

Desenvolvimento mantém 10 / 3 kg na ordem Máquina / Halter nos dois dias. Os nomes de apresentação fornecidos são preservados. Stiff / Mesa Flexora é mantido como uma escolha dentro de um único exercício, sem acrescentar exercícios obrigatórios.

## Status por exercicio

FEITO registra data, carga utilizada e alternativa escolhida, e move apenas aquele exercicio para o fim do card. DESFAZER preserva esse registro e devolve o exercicio aos pendentes. Todos concluidos finalizam o treino automaticamente. O botao do treino inteiro conclui todos; desfazer a conclusao inteira devolve todos aos pendentes. Os dados antigos sao migrados na mesma chave localStorage, sem apagar sessoes ou historico de carga. Status e registros sao separados por semana e dia.

## GitHub Pages

    npm run build

Publique o conteudo de `dist/` no GitHub Pages. A pasta contem somente index.html, style.css, app.js, model.js e .nojekyll. A producao nao depende de Node.js nem de backend. Caminhos relativos permitem publicar na raiz ou no subdiretorio do repositorio. O servidor Node.js e apenas para desenvolvimento local.

O armazenamento pertence ao navegador e a origem do site. Dados de localhost nao aparecem automaticamente no endereco GitHub Pages; o historico local existente permanece em localhost.
