#!/usr/bin/env bash
#
# Roda toda semana via launchd (com.saracgpereira.weekly-writing.plist).
# Junta commits recentes de varios repositorios locais, pede a um Claude
# headless (sem Bash, sem git, so Read/Write/Edit dentro deste repo) pra
# escolher UM assunto e escrever um rascunho novo em fonte/src/content/writing/,
# sempre com draft: true. O git add/commit do rascunho e feito aqui, por
# este script -- o Claude headless nunca chama git, entao nao ha como essa
# rodada dar push, mudar draft pra false, ou tocar em qualquer outro arquivo
# fora do repo do site.
#
# Log de cada rodada fica em fonte/.automation/run-*.log -- e o primeiro
# lugar pra olhar se um rascunho nao apareceu numa semana.

set -euo pipefail
export PATH="/usr/bin:/bin:/usr/local/bin:/Users/sara/.local/bin:$PATH"

CLAUDE_BIN="/Users/sara/.local/bin/claude"
SITE_DIR="/Users/sara/projetos/saracgpereira.com"
FONTE_DIR="$SITE_DIR/fonte"
WRITING_DIR="$FONTE_DIR/src/content/writing"
LOG_DIR="$FONTE_DIR/.automation"
mkdir -p "$LOG_DIR"

TS="$(date +%Y-%m-%d_%H%M%S)"
LOG_FILE="$LOG_DIR/run-$TS.log"
SCAN_FILE="$LOG_DIR/scan-$TS.txt"

{
echo "=== Weekly writing draft - $TS ==="

# Repositorios locais escaneados por assunto (so titulo de commit, nunca diff).
# Se um disco externo nao estiver montado, o repo e pulado, nao trava o resto.
REPOS=(
  "/Volumes/MacBook Pro II/projetos/tenant-scoped-rag"
  "/Volumes/MacBook Pro II/projetos/licitae"
  "/Volumes/MacBook Pro II/projetos/fiscalizae"
  "/Volumes/MacBook Pro II/projetos/suporte-sh3-hub"
  "/Volumes/MacBook Pro II/projetos/sh3-mcp-server"
  "/Volumes/MacBook Pro II/projetos/design-system"
  "/Volumes/MacBook Pro II/projetos/template-sh3"
)

echo "--- commit scan (ultimos 8 dias) ---" > "$SCAN_FILE"
for repo in "${REPOS[@]}"; do
  if [[ -d "$repo/.git" ]]; then
    # Atualiza a branch local antes de escanear -- ff-only, nunca mexe em
    # mudanca nao commitada. Se falhar (sem rede, conflito com trabalho em
    # progresso, sem upstream), so avisa no log e escaneia o que ja tem local.
    if ! git -C "$repo" pull --ff-only --quiet 2>>"$LOG_FILE"; then
      echo "## $repo -- pull falhou, escaneando estado local mesmo assim" >> "$SCAN_FILE"
    fi
    echo "## $repo" >> "$SCAN_FILE"
    git -C "$repo" log --since="8 days ago" --pretty=format:'%ad %h %s' --date=short -30 >> "$SCAN_FILE" 2>/dev/null || true
    echo >> "$SCAN_FILE"
  else
    echo "## $repo -- indisponivel (disco nao montado ou repo ausente)" >> "$SCAN_FILE"
  fi
done

BEFORE_LIST="$(mktemp)"
ls "$WRITING_DIR" > "$BEFORE_LIST"

PROMPT="Voce escreve UM rascunho de post tecnico novo para /writing, sem supervisao direta -- ninguem revisa em tempo real hoje.

Leia $SCAN_FILE: commits dos ultimos 8 dias em varios repositorios (alguns sao trabalho real de uma empresa, em producao).

Regras rigidas, sem excecao:
1. Escolha UMA decisao tecnica concreta e especifica -- algo com numero, trade-off ou teste, nao uma descricao generica de feature. Se nada no scan for digno de post, NAO crie arquivo nenhum e pare aqui.
2. NUNCA cite nome de cliente, nome de municipio/prefeitura, dado de producao real, ou qualquer identificador que nao esteja ja em algum arquivo de $WRITING_DIR/*.md como precedente ja publicado. Fale do padrao tecnico, nao do caso real por tras -- do jeito que os posts existentes ja fazem.
3. NUNCA mencione o nome do empregador nem identifique a empresa -- os posts e o CV ja publicados sao anonimizados quanto a isso.
4. Leia os posts existentes em $WRITING_DIR/*.md primeiro, pra calibrar tom, estrutura e o formato do frontmatter (title, description, pubDate, tags, draft).
5. Escreva o arquivo novo em $WRITING_DIR/ com draft: true SEMPRE -- nunca draft: false.
6. Escreva a prosa inteira, nao um esqueleto -- mas e rascunho pra revisao humana, ninguem vai publicar isso sozinho.
7. Voce so tem acesso de Read/Write/Edit dentro de $SITE_DIR. Nao tente rodar git, build ou deploy -- nao e sua tarefa, e as ferramentas nem estao disponiveis nesta sessao."

cd "$SITE_DIR"
"$CLAUDE_BIN" -p "$PROMPT" \
  --add-dir "$SITE_DIR" \
  --allowedTools "Read Write Edit Glob" \
  --permission-mode acceptEdits \
  --max-budget-usd 3 \
  --model claude-sonnet-5 \
  2>&1

AFTER_LIST="$(mktemp)"
ls "$WRITING_DIR" > "$AFTER_LIST"
NEW_FILES="$(comm -13 <(sort "$BEFORE_LIST") <(sort "$AFTER_LIST") || true)"

if [[ -n "$NEW_FILES" ]]; then
  cd "$SITE_DIR"
  while IFS= read -r f; do
    git add "fonte/src/content/writing/$f"
  done <<< "$NEW_FILES"

  FIRST_FILE="$(echo "$NEW_FILES" | head -1)"
  TITLE="$(grep -m1 '^title:' "$WRITING_DIR/$FIRST_FILE" | sed 's/^title: *//')"

  git commit -m "Adiciona rascunho automatico: $TITLE

Gerado pela automacao semanal (cron local, weekly-writing-draft.sh), sem
revisao humana ainda. Fica como draft: true ate a Sara revisar e aprovar.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

  osascript -e "display notification \"$TITLE\" with title \"Rascunho novo pra revisar\"" 2>/dev/null || true
  echo "Novo rascunho commitado: $NEW_FILES"
else
  echo "Nenhum rascunho novo esta semana (Claude nao achou assunto digno, ou o disco com os repos de origem nao estava montado)."
fi

rm -f "$BEFORE_LIST" "$AFTER_LIST"
} >> "$LOG_FILE" 2>&1
