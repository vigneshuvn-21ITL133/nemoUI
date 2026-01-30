FROM node:25.2.1 as build
WORKDIR /app
COPY package*.json  .
RUN npm install
COPY . .
RUN npm run dev

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g","daemon off;" ]
