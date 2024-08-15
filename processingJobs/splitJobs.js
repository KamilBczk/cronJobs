const { getSql } = require("../utils/databaseConnection");
const { accountingData } = require("./accountingData");
const { historyCheck } = require("./historyCheck");

async function splitJobs() {
  const sql = await getSql();
  const countQuery =
    await sql.query`SELECT COUNT(*) AS count FROM cbso.jobs where status = 'todo'`;
  const count = countQuery.recordset[0].count;
  console.log(count);
  if (count === 0) return;
  else {
    const jobs =
      await sql.query`SELECT TOP (25) * FROM cbso.jobs where status = 'todo' order by createdOn asc`;
    for (let i = 0; i < jobs.recordset.length; i++) {
      const element = jobs.recordset[i];
      const type = element.type;
      if (type === "accountingData") await accountingData(element);
      if (type === "historyCheck") await historyCheck(element);
    }
  }
}

module.exports = {
  splitJobs,
};
