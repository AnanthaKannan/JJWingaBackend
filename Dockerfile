FROM node:9-slim

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app

RUN npm install

COPY . /app

EXPOSE 4000

CMD ["npm", "start"]