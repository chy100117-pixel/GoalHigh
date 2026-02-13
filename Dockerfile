FROM nginx:alpine
# 将默认的 80 端口改为 8080 以匹配 Zeabur 的健康检查
RUN sed -i 's/listen\( \+\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 8080
