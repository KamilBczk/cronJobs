const sql = require("mssql");

async function getSql() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    debug: {
      packet: true, // Log les paquets envoyés/recus
      token: true, // Log les jetons envoyés/recus
      data: true, // Log les données
      payload: true, // Log les payloads de requête
    },
  };
  await sql.connect(config)
  return sql;
}

module.exports = {
  getSql,
};
