/**
 * Banco de dados do Mongo usado pela aplicação.
 *
 * NAO sai do caminho do MONGO_URI: o Mongoose recebe `dbName` explicito, e
 * e ele que vale. Isto ficava embutido no app.module e o backup precisou da
 * mesma informacao — com o literal repetido, uma mudanca em um lugar faria o
 * backup copiar um banco diferente do que a aplicacao usa, silenciosamente.
 */
export const MONGO_DATABASE = process.env.DB_MONGO || 'eduedu-escola-admin';
