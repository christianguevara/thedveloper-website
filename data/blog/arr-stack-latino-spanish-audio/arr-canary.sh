#!/bin/bash
# arr-canary v2 — weekly READ-ONLY checks for the Original / Latino profile setup.
# Runs on the Unraid host (User Scripts plugin, schedule Weekly). Talks to Radarr/Sonarr over their
# APIs, reads (never writes) app config files, and posts one summary through Unraid's `notify`.
# The only thing it writes is its own state file ($STATE_DIR/spanish.txt) used to detect titles that
# LOST Spanish audio since the previous run. Set STATE_DIR= (empty) to disable that.
#
# Install: Settings → User Scripts → Add New Script "arr-canary" → paste → Schedule: Weekly.
# Install AFTER the profiles/CFs/indexer exist (see ~/unraid-language-profiles-FINAL.md, step 9).
# Requires: jq + curl (both present on Unraid 7.3).
#
# Dry run without notifying / without writing state:
#   sed -e 's|^NOTIFY=.*|NOTIFY=echo|' -e 's|^STATE_DIR=.*|STATE_DIR=|' arr-canary.sh | ssh unraid 'bash -s'

set -u
RADARR=http://radarr:7878
SONARR=http://sonarr:8989
RADARR_KEY=$(sed -n 's:.*<ApiKey>\(.*\)</ApiKey>.*:\1:p' /mnt/user/appdata/radarr/config.xml)
SONARR_KEY=$(sed -n 's:.*<ApiKey>\(.*\)</ApiKey>.*:\1:p' /mnt/user/appdata/sonarr/config.xml)

# ---- CONFIG (keep in sync with recyclarr.yml / FINAL plan) ---------------------------
TRACKER_MATCH="YOUR-TRACKER"                      # substring of the YOUR-TRACKER indexer name(s)
MULTI_MATCH="MULTi"                           # substring that identifies the CUSTOM (MULTi) indexer
SPANISH_CF="Audio: Spanish"                   # local CF name (same in both apps)
EXPECTED_SCORE=10000                          # its score on every Latino profile
LATINO_GROUP="Latino ladder"                  # name of the single allowed quality group
RADARR_DEFAULT="Original only"
SONARR_DEFAULT="Original only (TV)"
RADARR_LATINO=("Latino if available")
SONARR_LATINO=("Latino if available (TV)")
FAMILY_TAG="family"                           # titles with this tag must sit on a Latino profile
CHURN_DAYS=7; CHURN_MAX=2                     # >2 imports of one item in 7 days = churn (1 stopgap + 1 upgrade is normal)
HEALTH_IGNORE='1337x'                            # regex of known/accepted health messages, e.g. '1337x' ('' = report all)
CUSTOM_DEF=/mnt/user/appdata/prowlarr/Definitions/Custom/your-tracker-multi.yml
UPSTREAM_DEF=/mnt/user/appdata/prowlarr/Definitions/your-tracker.yml
RECY_LOGS=/mnt/user/appdata/recyclarr/logs/cli
SEERR_SETTINGS=/mnt/user/appdata/seerr/settings.json
QBIT_CONF=/mnt/user/appdata/qbittorrent/config/qBittorrent.conf
# (seed-time backstop removed per owner decision — orphans are reported, not auto-purged)
MIN_FREE_GB=500                               # array (/mnt/user) free-space floor during/after convergence
MIN_CACHE_FREE_GB=100
LEGACY_PROFILES_R=("Any" "SD" "HD-720p" "HD-1080p" "Ultra-HD" "HD - 720p/1080p")
LEGACY_PROFILES_S=("Any" "SD" "HD-720p" "HD-1080p" "Ultra-HD" "HD - 720p/1080p" "DVD only" "WEB-2160p")
LQ_LOCAL_R=/mnt/user/appdata/recyclarr/custom-formats/radarr/lq-not-remux.json      # only if the optional exemption (Appendix C) is used
LQ_LOCAL_S=/mnt/user/appdata/recyclarr/custom-formats/sonarr/lq-not-remux.json
TRASH_CF=/mnt/user/appdata/recyclarr/resources/trash-guides/git/official/docs/json
STATE_DIR=/mnt/user/appdata/arr-canary
# ---------------------------------------------------------------------------------------

NOTIFY=/usr/local/emhttp/webGui/scripts/notify
PROBLEMS=(); INFO=()
problem() { PROBLEMS+=("$1"); echo "PROBLEM: $1"; }
ok()      { echo "ok: $1"; }
info()    { INFO+=("$1"); echo "info: $1"; }
api()     { curl -sf -m 60 -H "X-Api-Key: $2" "$1$3"; }   # api <base> <key> <path>; empty on HTTP error
NEW_STATE=""; APP_FAIL=0

check_app() {   # check_app <Radarr|Sonarr> <base> <key> <default profile> <latino profile>...
  local name=$1 base=$2 key=$3 defprof=$4; shift 4
  local profiles=("$@")

  if ! api "$base" "$key" /api/v3/system/status >/dev/null; then problem "$name: API unreachable"; APP_FAIL=1; return; fi

  # 1) YOUR-TRACKER: the enabled MULTi indexer exists with Multi Languages = Original(-2) + Spanish(3 or Latino 37/34)
  local idx; idx=$(api "$base" "$key" /api/v3/indexer)
  local enabled; enabled=$(jq -c --arg m "$TRACKER_MATCH" '[.[] | select((.name|contains($m)) and (.enableRss or .enableAutomaticSearch or .enableInteractiveSearch))]' <<<"$idx")
  local multi; multi=$(jq -c --arg mm "$MULTI_MATCH" '[.[] | select(.name|contains($mm))]' <<<"$enabled")
  if [ "$(jq length <<<"$multi")" = "0" ]; then
    problem "$name: no ENABLED indexer matching '$TRACKER_MATCH' + '$MULTI_MATCH' (deleted/renamed/disabled in Prowlarr?) → YOUR-TRACKER parses Spanish-only → rejected by Language=Original"
  else
    local langs; langs=$(jq -c '[.[0].fields[] | select(.name=="multiLanguages") | .value][0] // []' <<<"$multi")
    if jq -e '(index(-2) != null) and ((index(3) != null) or (index(37) != null) or (index(34) != null))' <<<"$langs" >/dev/null; then
      ok "$name: YOUR-TRACKER MULTi indexer Multi Languages = $langs"
    else
      problem "$name: YOUR-TRACKER MULTi indexer 'Multi Languages' = $langs (need Original + Spanish). Re-set it in $name → Settings → Indexers (lost if the indexer was re-added)"
    fi
  fi
  local old; old=$(jq -r --arg mm "$MULTI_MATCH" '[.[] | select(.name|contains($mm)|not) | .name] | join(", ")' <<<"$enabled")
  [ -n "$old" ] && problem "$name: old YOUR-TRACKER indexer still enabled ($old) — disable it in Prowlarr"

  # 2) Profiles + Spanish CF
  local cfs qp cfid
  cfs=$(api "$base" "$key" /api/v3/customformat)
  qp=$(api "$base" "$key" /api/v3/qualityprofile)
  jq -e --arg p "$defprof" '.[] | select(.name==$p)' <<<"$qp" >/dev/null || problem "$name: default profile '$defprof' missing"
  cfid=$(jq -r --arg n "$SPANISH_CF" '.[] | select(.name==$n) | .id' <<<"$cfs")
  local latino_ids=""
  if [ -z "$cfid" ]; then
    problem "$name: custom format '$SPANISH_CF' missing (Recyclarr resource provider broken?)"
  fi
  for p in "${profiles[@]}"; do
    local prof; prof=$(jq -c --arg p "$p" '[.[] | select(.name==$p)][0] // empty' <<<"$qp")
    if [ -z "$prof" ]; then problem "$name: profile '$p' missing"; continue; fi
    latino_ids+="$(jq -r .id <<<"$prof") "
    if [ -n "$cfid" ]; then
      local score; score=$(jq -r --argjson id "$cfid" '.formatItems[] | select(.format==$id) | .score' <<<"$prof")
      [ "$score" = "$EXPECTED_SCORE" ] && ok "$name: '$p' scores '$SPANISH_CF' = $score" \
        || problem "$name: '$p' scores '$SPANISH_CF' = '${score:-none}' (expected $EXPECTED_SCORE)"
    fi
    # single allowed group, named LATINO_GROUP, and it is the cutoff → quality always ties, CF score decides
    local shape; shape=$(jq -r --arg g "$LATINO_GROUP" '
      [.items[] | select(.allowed)] as $a
      | if ($a|length) != 1 then "has \($a|length) allowed quality entries (expected 1 group)"
        elif ($a[0].name != $g) then "allowed entry is \"\($a[0].name // $a[0].quality.name)\" (expected group \"\($g)\")"
        elif (.cutoff != $a[0].id) then "cutoff is not the \"\($g)\" group"
        else "ok" end' <<<"$prof")
    [ "$shape" = ok ] && ok "$name: '$p' has the single '$LATINO_GROUP' group as cutoff" \
      || problem "$name: '$p' $shape → a higher QUALITY English-only release could replace a Spanish file"
    # language guarantee (2026-10-12 ranking alignment): the Latino profiles now carry TRaSH-scored CFs, which
    # Recyclarr re-syncs from the guide. Best possible non-Spanish score (max per mutually exclusive family:
    # resolution / tier / repack / streaming service / streaming boost; everything else summed) must stay below
    # the worst acceptable Spanish score (Spanish + all soft penalties > -10000). Fails if TRaSH inflates scores.
    if [ -n "$cfid" ]; then
      local margin; margin=$(jq -r --argjson sid "$cfid" '
        ([.formatItems[] | select(.format==$sid) | .score][0] // 0) as $sp
        | [.formatItems[] | select(.format != $sid)] as $f
        | ([$f[] | select(.score > 0)
            | .cat = (if (.name|test("^Resolution: ")) then "res"
                      elif (.name|test("Tier 0[1-9]$|^WEB Scene$")) then "tier"
                      elif (.name|test("^Repack")) then "repack"
                      elif (.name|test("Streaming Boost$")) then "boost"
                      elif (.name|test("^(AMZN|ATVP?|CC|DCU|DSNP|HBO|HMAX|HULU|iT|MAX|NF|PCOK|PMTP|PLAY|ROKU|SHO|STAN|SYFY|BCORE|CRiT|MA)$")) then "svc"
                      else .name end)]
           | group_by(.cat) | map(max_by(.score).score) | add // 0) as $eng
        | ($sp + ([$f[] | select(.score < 0 and .score > -10000) | .score] | add // 0)) as $spa
        | "\($eng) \($spa)"' <<<"$prof")
      local maxeng=${margin% *} minspa=${margin#* }
      if [ "$maxeng" -lt "$minspa" ] 2>/dev/null; then
        ok "$name: '$p' best non-Spanish score $maxeng < worst Spanish $minspa (margin $((minspa-maxeng)))"
      else
        problem "$name: '$p' best possible non-Spanish score $maxeng >= worst acceptable Spanish score $minspa → an English-only release could replace a Spanish file (TRaSH scores changed? lower Resolution/tier CFs on Latino)"
      fi
    fi
    if [ "$name" = Radarr ]; then
      local lang; lang=$(jq -r '.language.name // "none"' <<<"$prof")
      [ "$lang" = Original ] || problem "$name: '$p' Language = $lang (expected Original)"
    fi
    local minfs; minfs=$(jq -r '.minFormatScore' <<<"$prof")
    [ "$minfs" -ge 0 ] 2>/dev/null || problem "$name: '$p' minFormatScore = $minfs (expected >= 0)"
  done

  # 3) Spanish-audio inventory of titles on Latino profiles (+ family-tag placement)
  local ids_json; ids_json=$(printf '%s\n' $latino_ids | jq -R 'select(length>0)|tonumber' | jq -s -c .)
  local famid; famid=$(api "$base" "$key" /api/v3/tag | jq -r --arg t "$FAMILY_TAG" '.[] | select(.label==$t) | .id')
  local groupq; groupq=$(jq -c --arg g "$LATINO_GROUP" '[.[] | .items[] | select(.allowed and .name==$g) | .items[].quality.name] | unique' <<<"$qp")
  local rows=""
  if [ "$name" = Radarr ]; then
    local movies; movies=$(api "$base" "$key" /api/v3/movie)
    if [ -n "$famid" ]; then
      local misplaced; misplaced=$(jq -r --argjson ids "$ids_json" --argjson f "$famid" \
        '[.[] | select((.tags|index($f)) and ((.qualityProfileId as $q | $ids | index($q)) == null)) | "\(.title) (\(.year))"] | join(", ")' <<<"$movies")
      [ -n "$misplaced" ] && problem "Radarr: '$FAMILY_TAG' titles NOT on a Latino profile: $misplaced"
    fi
    # rows: key<TAB>hasSpanish(1/0/-)<TAB>qualityInGroup(1/0/-)<TAB>label
    rows=$(jq -r --argjson ids "$ids_json" --argjson gq "$groupq" '
      .[] | select(.qualityProfileId as $q | $ids | index($q)) |
      ["M\(.id)",
       (if .movieFile then ((.movieFile.languages|map(.name)|map(select(startswith("Spanish")))|length>0)|if . then "1" else "0" end) else "-" end),
       (if .movieFile then (if (.movieFile.quality.quality.name as $qn | $gq | index($qn)) then "1" else "0" end) else "-" end),
       "\(.title) (\(.year))" + (if .movieFile then " [\(.movieFile.quality.quality.name)]" else "" end)] | @tsv' <<<"$movies")
  else
    local series; series=$(api "$base" "$key" /api/v3/series)
    if [ -n "$famid" ]; then
      local misplaced; misplaced=$(jq -r --argjson ids "$ids_json" --argjson f "$famid" \
        '[.[] | select((.tags|index($f)) and ((.qualityProfileId as $q | $ids | index($q)) == null)) | .title] | join(", ")' <<<"$series")
      [ -n "$misplaced" ] && problem "Sonarr: '$FAMILY_TAG' series NOT on a Latino profile: $misplaced"
    fi
    local sid
    for sid in $(jq -r --argjson ids "$ids_json" '.[] | select(.qualityProfileId as $q | $ids | index($q)) | .id' <<<"$series"); do
      local stitle; stitle=$(jq -r --argjson s "$sid" '.[] | select(.id==$s) | .title' <<<"$series")
      rows+=$(api "$base" "$key" "/api/v3/episode?seriesId=$sid&includeEpisodeFile=true" | jq -r --argjson gq "$groupq" --arg st "$stitle" '
        .[] | select(.hasFile and .episodeFile != null) |
        ["E\(.id)",
         ((.episodeFile.languages|map(.name)|map(select(startswith("Spanish")))|length>0)|if . then "1" else "0" end),
         (if (.episodeFile.quality.quality.name as $qn | $gq | index($qn)) then "1" else "0" end),
         "\($st) S\(.seasonNumber)E\(.episodeNumber) [\(.episodeFile.quality.quality.name)]"] | @tsv')$'\n'
    done
  fi
  local total=0 spa=0 waiting=0 outside=""
  while IFS=$'\t' read -r k s g label; do
    [ -z "$k" ] && continue
    total=$((total+1))
    [ "$s" = 1 ] && { spa=$((spa+1)); NEW_STATE+="$name:$k"$'\t'"$label"$'\n'; }
    [ "$s" = 0 ] && waiting=$((waiting+1))
    [ "$g" = 0 ] && outside+="$label; "
  done <<<"$rows"
  [ -n "$outside" ] && problem "$name: Latino titles whose file quality is OUTSIDE the '$LATINO_GROUP' group (ANY release, even English-only, can replace them): $outside"
  info "$name Latino: $total items, $spa with Spanish audio, $waiting waiting for a Spanish release"

  # 3b) Convergence progress: items/collections still on legacy profiles; download client purges completed torrents
  local legacy; if [ "$name" = Radarr ]; then legacy=("${LEGACY_PROFILES_R[@]}"); else legacy=("${LEGACY_PROFILES_S[@]}"); fi
  local lp items_json; if [ "$name" = Radarr ]; then items_json=$movies; else items_json=$series; fi
  for lp in "${legacy[@]}"; do
    local lid; lid=$(jq -r --arg p "$lp" '.[] | select(.name==$p) | .id' <<<"$qp")
    [ -z "$lid" ] && continue
    local n; n=$(jq --argjson l "$lid" '[.[] | select(.qualityProfileId==$l)] | length' <<<"$items_json")
    local nc=0; [ "$name" = Radarr ] && nc=$(api "$base" "$key" /api/v3/collection | jq --argjson l "$lid" '[.[] | select(.qualityProfileId==$l)] | length')
    if [ "$n" = 0 ] && [ "$nc" = 0 ]; then info "$name: legacy profile '$lp' is unused → can be deleted"
    else info "$name: legacy profile '$lp' still used by $n item(s), $nc collection(s)"; fi
  done
  local rc; rc=$(api "$base" "$key" /api/v3/downloadclient | jq -r '[.[] | select(.enable and .protocol=="torrent") | select(.removeCompletedDownloads|not) | .name] | join(", ")')
  [ -n "$rc" ] && problem "$name: download client(s) '$rc' have Remove Completed OFF → replaced files' torrents are never purged"

  # 4) Churn: same item imported more than CHURN_MAX times in CHURN_DAYS
  local since hist dup
  since=$(date -u -d "-$CHURN_DAYS days" +%Y-%m-%dT%H:%M:%SZ)
  hist=$(api "$base" "$key" "/api/v3/history/since?date=$since&eventType=downloadFolderImported")
  if [ "$name" = Radarr ]; then
    dup=$(jq -r --argjson m "$CHURN_MAX" 'group_by(.movieId) | map(select(length > $m)) | .[] | "\(length)x \(.[0].sourceTitle)"' <<<"$hist" 2>/dev/null)
  else
    dup=$(jq -r --argjson m "$CHURN_MAX" 'group_by(.episodeId) | map(select(length > $m)) | group_by(.[0].seriesId) | .[] | "\(length) episode(s) re-imported >\($m)x, e.g. \(.[0][0].sourceTitle)"' <<<"$hist" 2>/dev/null)
  fi
  [ -n "$dup" ] && problem "$name: repeated imports in ${CHURN_DAYS}d (file scores below its grab → re-grab loop?): $dup" || ok "$name: no import churn"

  # 5) Health warnings (otherwise they sit unseen)
  local health msgs; health=$(api "$base" "$key" /api/v3/health)
  msgs=$(jq -r '.[] | "\(.type): \(.message)"' <<<"${health:-[]}")
  [ -n "$HEALTH_IGNORE" ] && msgs=$(grep -Ev "$HEALTH_IGNORE" <<<"$msgs")
  [ -n "$msgs" ] && problem "$name health: $msgs" || ok "$name: health clean"
}

check_app Radarr "$RADARR" "$RADARR_KEY" "$RADARR_DEFAULT" "${RADARR_LATINO[@]}"
check_app Sonarr "$SONARR" "$SONARR_KEY" "$SONARR_DEFAULT" "${SONARR_LATINO[@]}"

# 6) Spanish LOST since last run (titles that had Spanish audio last week and don't now)
if [ -n "$STATE_DIR" ] && [ "$APP_FAIL" = 0 ]; then
  mkdir -p "$STATE_DIR"
  if [ -f "$STATE_DIR/spanish.txt" ]; then
    lost=""
    while IFS=$'\t' read -r k label; do
      [ -z "$k" ] && continue
      grep -q "^$k"$'\t' <<<"$NEW_STATE" || lost+="$label; "
    done < "$STATE_DIR/spanish.txt"
    [ -n "$lost" ] && problem "SPANISH LOST (had Spanish audio last run, not now — replaced, deleted or moved off the Latino profile): $lost" \
      || ok "no title lost Spanish since last run"
  fi
  printf '%s' "$NEW_STATE" > "$STATE_DIR/spanish.txt"
fi

# 7) Recyclarr ran recently and cleanly (log lines look like "[00:00:06 WRN] ...")
LOG=$(ls -t "$RECY_LOGS"/*.log 2>/dev/null | head -1)
if   [ -z "$LOG" ]; then problem "Recyclarr: no log found in $RECY_LOGS"
elif [ $(( $(date +%s) - $(stat -c %Y "$LOG") )) -gt $((2*86400)) ]; then problem "Recyclarr: last run older than 2 days ($LOG)"
elif grep -qE '^\[[0-9:]+ (WRN|ERR|FTL)\]' "$LOG"; then problem "Recyclarr: warnings/errors in last run: $(grep -E '^\[[0-9:]+ (WRN|ERR|FTL)\]' "$LOG" | head -3 | cut -c1-200)"
else ok "Recyclarr: last run clean"; fi

# 8) Custom Prowlarr definition present and matching upstream apart from our edits.
#    Compares content, not mtime: Prowlarr re-downloads definitions on its own, which bumps the
#    upstream file's date without changing it. Our edits (id/name, the title_subs block, the title
#    text line) are stripped from both files before comparing.
def_norm(){ sed -E '/^(id|name):/d; /^[[:space:]]+text: "\{\{ \.Result\.title_phase1/d' "$1" \
  | awk '/^[[:space:]]+title_subs:/{skip=3} skip>0{skip--; next} {print}'; }
if [ ! -f "$CUSTOM_DEF" ]; then problem "Prowlarr: $CUSTOM_DEF missing"
elif [ -f "$UPSTREAM_DEF" ] && ! diff -q <(def_norm "$UPSTREAM_DEF") <(def_norm "$CUSTOM_DEF") >/dev/null; then
  problem "Prowlarr: upstream your-tracker.yml changed beyond your edits — port the change (keep the title lines): $(diff <(def_norm "$UPSTREAM_DEF") <(def_norm "$CUSTOM_DEF") | grep -E '^[<>]' | head -3 | cut -c1-150 | tr '\n' ' ')"
else ok "Prowlarr: custom YOUR-TRACKER definition present and current"; fi

# 8b) Disk: free-space floors (convergence batches must stop when these trip)
free=$(df -BG --output=avail /mnt/user | tail -1 | tr -dc 0-9); cfree=$(df -BG --output=avail /mnt/cache | tail -1 | tr -dc 0-9)
[ "${free:-0}" -lt "$MIN_FREE_GB" ] && problem "Disk: /mnt/user free ${free} GB < ${MIN_FREE_GB} GB — pause convergence batches" || ok "Disk: /mnt/user free ${free} GB"
[ "${cfree:-0}" -lt "$MIN_CACHE_FREE_GB" ] && problem "Disk: cache free ${cfree} GB < ${MIN_CACHE_FREE_GB} GB" || ok "Disk: cache free ${cfree} GB"
info "Disk free: array ${free} GB, cache ${cfree} GB"

# 8c) Orphan seeds report (Decision #3 amended: no seed-time limit; purge orphans by hand).
#     An orphan = a torrent none of whose files is hardlinked into the library (every file has link count 1),
#     seeded for more than ORPHAN_MIN_DAYS. Reported as info (list only, never deleted here).
ORPHAN_MIN_DAYS=${ORPHAN_MIN_DAYS:-14}
tinfo=$(docker exec qbittorrent curl -s "http://localhost:8080/api/v2/torrents/info" 2>/dev/null)
if [ -n "$tinfo" ]; then
  now=$(date +%s); ocount=0; obytes=0; olist=""
  while IFS=$'\t' read -r hash name size cpath completed; do
    [ -z "$cpath" ] && continue
    [ "${completed:-0}" -le 0 ] && continue
    days=$(( (now - completed) / 86400 ))
    [ "$days" -lt "$ORPHAN_MIN_DAYS" ] && continue
    host_path="/mnt/user/mediadata/torrents${cpath#/data/torrents}"
    [ -e "$host_path" ] || continue
    linked=$(find "$host_path" -type f -links +1 2>/dev/null | head -1)
    if [ -z "$linked" ]; then
      ocount=$((ocount+1)); obytes=$((obytes+size))
      olist+="$(awk -v s="$size" -v d="$days" -v n="$name" 'BEGIN{printf "%7.1f GB  %4dd  %s\n", s/1e9, d, n}')"$'\n'
    fi
  done < <(jq -r '.[] | [.hash, .name, .size, .content_path, .completion_on] | @tsv' <<<"$tinfo")
  if [ "$ocount" -gt 0 ]; then
    info "Orphan seeds (> ${ORPHAN_MIN_DAYS} d, not hardlinked to library): ${ocount} torrents, $(awk -v b="$obytes" 'BEGIN{printf "%.2f", b/1e12}') TB — candidates for manual purge:"$'\n'"$(echo "$olist" | sort -rn | head -25)"
  else ok "qBittorrent: no orphan seeds older than ${ORPHAN_MIN_DAYS} d"; fi
fi

# 8d) Optional local "LQ (not remux)" CF still in sync with TRaSH lq.json (only if Appendix C is in use)
for pair in "radarr:$LQ_LOCAL_R" "sonarr:$LQ_LOCAL_S"; do
  app=${pair%%:*}; f=${pair#*:}; [ -f "$f" ] || continue
  a=$(jq -r '[.specifications[] | select(.implementation=="ReleaseGroupSpecification") | .fields.value] | sort | join("|")' "$TRASH_CF/$app/cf/lq.json" 2>/dev/null)
  b=$(jq -r '[.specifications[] | select(.implementation=="ReleaseGroupSpecification") | .fields.value] | sort | join("|")' "$f")
  [ -n "$a" ] && [ "$a" != "$b" ] && problem "$app: local 'LQ (not remux)' CF drifted from TRaSH lq.json — re-run the generator in FINAL.md Appendix C"
done

# 9) Seerr still defaults to the Original profiles
if [ -f "$SEERR_SETTINGS" ]; then
  sr=$(jq -r '[.radarr[] | select(.isDefault and (.is4k|not)) | .activeProfileName][0] // "none"' "$SEERR_SETTINGS")
  ss=$(jq -r '[.sonarr[] | select(.isDefault and (.is4k|not)) | .activeProfileName][0] // "none"' "$SEERR_SETTINGS")
  [ "$sr" = "$RADARR_DEFAULT" ] && [ "$ss" = "$SONARR_DEFAULT" ] && ok "Seerr defaults: $sr / $ss" \
    || problem "Seerr default profiles are '$sr' / '$ss' (expected '$RADARR_DEFAULT' / '$SONARR_DEFAULT')"
fi

# ---- report → Unraid notify → Pushover ------------------------------------------------
# "-i '<level> 5'" overrides the per-level routing (5 = browser + agents): today Settings → Notifications
# has normal=0 and warning=1 (browser only), so a plain "-i warning" would never reach Pushover.
# Pushover rejects messages > 1024 chars → short description; full text goes into the archive (-m).
join() { printf '%s\\n' "$@"; }
if [ ${#PROBLEMS[@]} -eq 0 ]; then
  DESC="All checks passed.\\n$(join "${INFO[@]}")"
  $NOTIFY -e "arr-canary" -s "Media stack OK" -d "${DESC:0:900}" -m "$DESC" -i "normal 5"
else
  DESC="$(join "${PROBLEMS[@]}")"
  $NOTIFY -e "arr-canary" -s "Media stack: ${#PROBLEMS[@]} problem(s)" -d "${DESC:0:900}" -m "$DESC\\n$(join "${INFO[@]}")" -i "warning 5"
fi
exit 0
