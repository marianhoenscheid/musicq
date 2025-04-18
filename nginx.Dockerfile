FROM nginx:latest
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY web/minified /usr/share/nginx/html
