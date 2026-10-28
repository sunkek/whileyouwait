# index.html is the page body only (it started as a Claude artifact, which adds
# the document skeleton at publish time). head.html supplies that skeleton:
# doctype, charset, viewport and a base reset.
FROM nginx:1.31-alpine
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY .docker/head.html index.html /tmp/page/
RUN cat /tmp/page/head.html /tmp/page/index.html > /usr/share/nginx/html/index.html && rm -r /tmp/page
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
