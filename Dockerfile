FROM node:18

WORKDIR /usr/src/app

COPY package.json ./

RUN npm i

COPY . .

RUN npx prisma generate

RUN npm run build

CMD [ "node", "--max-old-space-size=6144", "dist/src/main.js" ]
