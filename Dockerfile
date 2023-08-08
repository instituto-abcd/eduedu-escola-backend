FROM node:18

WORKDIR /usr/src/app

ARG ARG_FIRESTORE_READ_SERVICEACCOUNT
ENV FIRESTORE_READ_SERVICEACCOUNT=${ARG_FIRESTORE_READ_SERVICEACCOUNT}

COPY package.json ./

RUN yarn

COPY . .

RUN yarn prisma generate

RUN yarn build

CMD [ "node", "dist/src/main.js" ]