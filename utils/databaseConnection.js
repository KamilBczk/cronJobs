const sql = require("mssql");

async function getSql() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
  await sql.connect(config);
  return sql;
}

module.exports = {
  getSql,
};
