
# EduEdu+ &mdash; Backend

## Gitflow

![image](https://github.com/user-attachments/assets/334f1711-93c4-45d9-b311-35fec3f8d9fe)


Webserver para os serviços do EduEdu+, usando o framework [Nest.js](https://docs.nestjs.com/v5/). Utilizamos Docker para empacotar em container o servidor e _os_ bancos de dados.

## Instruções de inicialização

Após clonado o projeto, siga as instruções para executá-lo:

1. `npm install`;
2. `npm run env:login`
3. Siga as instruções no terminal para logar-se no [vault.dotenv.org](https://vault.dotenv.org/). Importante que já tenha recebido o invite para o workspace _EduEdu+_.
4. `npm run env:pull`

**Certifique-se de que o daemon do Docker está rodando em sua máquina.**

5. `npm run start:dev-full`;

Ao seguir essas etapas o projeto será iniciado.

### Próximos passos

Solicite invite ao nosso workspace no Postman para ter acesso a documentação da API.
Clone e rode os clients frontend ([admin](https://github.com/instituto-abcd/eduedu-escola-admin) e [aluno](https://github.com/instituto-abcd/eduedu-escola-aluno)) e aponte as variáveis de ambiente de ambos para a url local onde está rodando o seu backend, pra ter o projeto completo em desenvolvimento.
