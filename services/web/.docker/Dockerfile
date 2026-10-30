# One nginx image serves the catalog and every game. Build context is
# services/. Each game's index.html is a page body (the games started as Claude
# artifacts, which add the document skeleton at publish time); its head.html
# supplies that skeleton, and the two are joined into <game>/index.html.
FROM nginx:1.31-alpine
COPY web/.docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY web/public/ /usr/share/nginx/html/
COPY hexroute/head.html hexroute/index.html /tmp/games/hexroute/
COPY root-cause/head.html root-cause/index.html root-cause/puzzles.js /tmp/games/root-cause/
COPY flaky/head.html flaky/index.html /tmp/games/flaky/
COPY loom/head.html loom/index.html /tmp/games/loom/
COPY poise/head.html poise/index.html /tmp/games/poise/
COPY runoff/head.html runoff/index.html /tmp/games/runoff/
COPY timber/head.html timber/index.html timber/puzzles.js /tmp/games/timber/
# The service worker's precache list is then filled with every game's files.
RUN set -e; cd /tmp/games; games="$(echo *)"; for g in $games; do \
      mkdir -p "/usr/share/nginx/html/$g"; \
      cat "$g/head.html" "$g/index.html" > "/usr/share/nginx/html/$g/index.html"; \
      rm "$g/head.html" "$g/index.html"; \
      cp -r "$g/." "/usr/share/nginx/html/$g/"; \
    done; rm -r /tmp/games; \
    cd /usr/share/nginx/html; \
    list="$(find $games -type f | sort | sed -e 's|index\.html$||' -e "s|.*|'/&'|" | paste -sd, -)"; \
    sed -i "s|/\* GAMES \*/|$list|" sw.js; grep -q "'/runoff/'" sw.js
# Empty until the Umami website exists; without it the pages load no tracker.
ENV UMAMI_WEBSITE_ID=""
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
