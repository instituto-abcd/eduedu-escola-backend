[![DEVELOPMENT - CI/CD Pipeline](https://github.com/instituto-abcd/eduedu-escola-backend/actions/workflows/ci-pipeline.yml/badge.svg?branch=main)](https://github.com/instituto-abcd/eduedu-escola-backend/actions/workflows/ci-pipeline.yml)

---

[![STAGING - CI/CD Pipeline](https://github.com/instituto-abcd/eduedu-escola-backend/actions/workflows/gcp.staging.yml/badge.svg?branch=staging)](https://github.com/instituto-abcd/eduedu-escola-backend/actions/workflows/gcp.staging.yml)

[![Swagger UI](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=white)](https://eduedu-escola-backend-3djofcpyaq-uc.a.run.app/swagger)

---

## Gestão de Branches

Fluxo utilizado: **Git Flow**

![git-flow](https://i.imgur.com/Wk7LfaW.png)

---

## Arquitetura

Diagramas arquiteturais (Modelo C4) :point_right:
https://instituto-abcd.github.io/eduedu-escola-docs/

---

# Tutoriais

## Executar a sincronização de planetas/artefatos localmente

**_Atenção: Apontar as connection strings para o ambiente local_**

1. Excluir a pasta dist

2. Parar e remover todos os containers
```
docker container stop $(docker container list -qa) && docker container rm $(docker container list -qa)
```

3. Parar todos os containers e limpar os dados do Docker
```
docker system prune -a -f && docker system prune --volumes -f
```

4. Atualizar os pacotes da aplicação
```
npm install
```

5. Subir os container auxiliares à aplicação
```
docker-compose up -d
```

6. Executar as migrations
```
npm run migrations
```

7. Executar a aplicação
```
npm run start:dev
```

8. Executar a request de sincronização de planetas
```
  curl -X 'POST' \
    'http://localhost:3000/planet-sync/sync-all' \
    -H 'accept: application/json' \
    -d ''
```

9. Verificar status da sincronização de planetas
```
  curl -X 'GET' \
    'http://localhost:3000/planet-sync/sync-status' \
    -H 'accept: */*'
```
