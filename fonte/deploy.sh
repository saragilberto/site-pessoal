#!/usr/bin/env bash
#
# Publica o site no Hostinger (shared hosting, SSH na 65002).
#
# O alias `saracg` vive no ~/.ssh/config. --delete limpa arquivos que sairam
# do build, mas api/ fica de fora: aquele default.php e placeholder da
# Hostinger, nao e nosso, e apagar so criaria ruido.

set -euo pipefail

# O site e publico e o nome do empregador nao pode ser. Se CV_EMPREGADOR
# estiver setada, o build sai com a versao nomeada do CV — que serve para
# enviar a um recrutador, nunca para publicar.
if [[ -n "${CV_EMPREGADOR:-}" ]]; then
  echo "abortado: CV_EMPREGADOR esta setada (${CV_EMPREGADOR})." >&2
  echo "essa variavel gera o CV nomeado, que nao vai para o ar." >&2
  exit 1
fi

DESTINO="saracg:domains/saracgpereira.com/public_html/"

npm run build

echo
echo "Enviando para ${DESTINO}"
rsync -avz --delete --exclude 'api/' -e "ssh" dist/ "${DESTINO}"

echo
echo "Publicado — https://saracgpereira.com/"

echo
echo "Gerando rascunhos de LinkedIn para posts publicados sem rascunho ainda..."
if ! ./linkedin-draft.sh; then
  echo "aviso: rascunho de LinkedIn falhou (site ja foi publicado, so o rascunho ficou pendente)." >&2
  echo "ver log em fonte/.automation/linkedin-run-*.log" >&2
fi
