FROM node:18

WORKDIR /usr/src/app

ARG ARG_DATABASE_URL
ENV DATABASE_URL=${ARG_DATABASE_URL}

COPY package.json ./

RUN yarn

COPY . .

RUN yarn prisma generate

RUN yarn build

CMD [ "node", "dist/src/main.js" ]