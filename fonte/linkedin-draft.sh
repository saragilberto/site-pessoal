#!/usr/bin/env bash
#
# Roda ao final de todo deploy.sh bem-sucedido (chamado por ele) e pode ser
# rodado manualmente pra fazer backfill de posts ja publicados. Pra cada post
# em /writing com draft: false que ainda nao tem rascunho de LinkedIn em
# fonte/linkedin-drafts/, pede a um Claude headless (sem Bash, sem git, so
# Read do post e Write dentro de linkedin-drafts/) pra escrever um rascunho
# de post pra LinkedIn.
#
# So gera texto. Nunca posta nada -- nao ha integracao com a API do LinkedIn
# aqui de proposito. A Sara cola manualmente depois de revisar.
#
# Log de cada rodada fica em fonte/.automation/linkedin-run-*.log.

set -euo pipefail
export PATH="/usr/bin:/bin:/usr/local/bin:/Users/sara/.local/bin:$PATH"

CLAUDE_BIN="/Users/sara/.local/bin/claude"
SITE_DIR="/Users/sara/projetos/saracgpereira.com"
FONTE_DIR="$SITE_DIR/fonte"
WRITING_DIR="$FONTE_DIR/src/content/writing"
DRAFTS_DIR="$FONTE_DIR/linkedin-drafts"
LOG_DIR="$FONTE_DIR/.automation"
mkdir -p "$DRAFTS_DIR" "$LOG_DIR"

TS="$(date +%Y-%m-%d_%H%M%S)"
LOG_FILE="$LOG_DIR/linkedin-run-$TS.log"

{
echo "=== LinkedIn draft - $TS ==="

cd "$SITE_DIR"
NEW_DRAFTS=()

for post in "$WRITING_DIR"/*.md; do
  slug="$(basename "$post" .md)"
  draft_out="$DRAFTS_DIR/$slug.txt"

  is_draft="$(grep -m1 '^draft:' "$post" | sed 's/^draft: *//')"
  if [[ "$is_draft" != "false" ]]; then
    continue
  fi
  if [[ -f "$draft_out" ]]; then
    continue
  fi

  echo "-- gerando rascunho de LinkedIn para $slug"

  PROMPT="Voce escreve UM rascunho de post do LinkedIn anunciando o artigo tecnico abaixo, sem supervisao direta -- ninguem revisa em tempo real hoje.

Leia $post -- e o artigo publicado em https://saracgpereira.com/writing/$slug/.

Regras rigidas, sem excecao:
1. Escreva em portugues, tom direto, sem jargao de 'growth'/'thought leadership' -- sem emoji, sem hashtag em excesso (no maximo 3, relevantes), sem CTA generico tipo 'o que voces acham?'.
2. NUNCA invente numero, resultado ou detalhe que nao esteja no artigo. Se o artigo nao afirma algo, o post do LinkedIn tambem nao afirma.
3. NUNCA cite nome de cliente, nome de municipio/prefeitura, dado de producao real, ou identifique o empregador -- mesma regra do site.
4. Termine com o link do artigo: https://saracgpereira.com/writing/$slug/
5. De 3 a 8 linhas curtas, pensado pra tela de celular -- nao e o artigo reescrito, e um gancho pra quem nao clicou ainda.
6. Escreva so o texto final do post em $draft_out, nada mais (sem frontmatter, sem comentario). Voce so tem acesso de Read a $post e Write dentro de $DRAFTS_DIR -- nao tente rodar git, build ou postar em lugar nenhum, nao e sua tarefa e as ferramentas nem estao disponiveis nesta sessao."

  "$CLAUDE_BIN" -p "$PROMPT" \
    --add-dir "$FONTE_DIR" \
    --allowedTools "Read Write Glob" \
    --permission-mode acceptEdits \
    --max-budget-usd 2 \
    --model claude-sonnet-5 \
    2>&1

  if [[ -f "$draft_out" ]]; then
    NEW_DRAFTS+=("$slug")
  fi
done

if [[ ${#NEW_DRAFTS[@]} -gt 0 ]]; then
  for slug in "${NEW_DRAFTS[@]}"; do
    git add "fonte/linkedin-drafts/$slug.txt"
  done

  LIST="$(printf '%s, ' "${NEW_DRAFTS[@]}")"
  LIST="${LIST%, }"

  git commit -m "Adiciona rascunho de LinkedIn: $LIST

Gerado automaticamente apos o deploy, sem revisao humana ainda. Texto fica
em fonte/linkedin-drafts/ pra Sara revisar e colar manualmente -- nada e
postado sozinho.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

  osascript -e "display notification \"$LIST\" with title \"Rascunho de LinkedIn pra revisar\"" 2>/dev/null || true
  echo "Novos rascunhos: $LIST"
else
  echo "Nenhum post novo publicado sem rascunho de LinkedIn."
fi
} >> "$LOG_FILE" 2>&1
