# FROM node:10-alpine
FROM arm32v7/node
COPY . /usr/app
WORKDIR /usr/app
RUN npm install && npm run build

# FROM nginx:alpine
FROM arm32v7/nginx
COPY --from=0 /usr/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["/bin/bash", "-c", "nginx -g \"daemon off;\""]
