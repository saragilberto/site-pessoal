#!/usr/bin/env bash
#
# Publica o site no Hostinger (shared hosting, SSH na 65002).
#
# O alias `saracg` vive no ~/.ssh/config. --delete limpa arquivos que sairam
# do build, mas api/ fica de fora: aquele default.php e placeholder da
# Hostinger, nao e nosso, e apagar so criaria ruido.

set -euo pipefail

DESTINO="saracg:domains/saracgpereira.com/public_html/"

npm run build

echo
echo "Enviando para ${DESTINO}"
rsync -avz --delete --exclude 'api/' -e "ssh" dist/ "${DESTINO}"

echo
echo "Publicado — https://saracgpereira.com/"
