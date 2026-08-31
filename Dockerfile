FROM node:18

# Clientes de banco usados pelo BackupService (pg_dump/psql, mongodump/mongorestore).
# O dump sai pela rede, de dentro deste container, entao os binarios precisam existir
# aqui - e nao no container do banco.
#
# postgresql-client vem do repositorio da PGDG porque o apt do Debian bookworm so
# oferece o cliente 15, e o pg_dump precisa ser >= a major do servidor (o compose do
# eduedu-escola-setup usa postgres:17.6). Com o cliente mais antigo o pg_dump recusa a
# conexao por incompatibilidade de versao.
ARG PG_MAJOR=17
ARG MONGO_TOOLS_VERSION=100.10.0

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates \
      curl \
      gnupg \
  && install -d /usr/share/postgresql-common/pgdg \
  && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
  && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
  && curl -fsSL "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-${MONGO_TOOLS_VERSION}.deb" \
       -o /tmp/mongodb-database-tools.deb \
  && apt-get update && apt-get install -y --no-install-recommends \
      "postgresql-client-${PG_MAJOR}" \
      /tmp/mongodb-database-tools.deb \
  && rm -f /tmp/mongodb-database-tools.deb \
  && rm -rf /var/lib/apt/lists/* \
  && pg_dump --version \
  && psql --version \
  && mongodump --version \
  && mongorestore --version

WORKDIR /usr/src/app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

CMD [ "node", "--max-old-space-size=6144", "dist/src/main.js" ]
