const { getSql } = require("../utils/databaseConnection");
const { accountingData } = require("./accountingData");
const { historyCheck } = require("./historyCheck");

async function splitJobs() {
  const startTime = new Date();
  const sql = await getSql();
  const countQuery =
    await sql.query`SELECT COUNT(*) AS count FROM cbso.jobs where status = 'test'`;
  const count = countQuery.recordset[0].count;
  if (count === 0) return;
  else {
    const jobs =
      await sql.query`SELECT TOP (75) * FROM cbso.jobs where status = 'test' order by priority desc, createdOn`;
    for (let i = 0; i < jobs.recordset.length; i++) {
      const element = jobs.recordset[i];
      const type = element.type;
      if (type === "accountingData") await accountingData(element);
      if (type === "historyCheck") await historyCheck(element);
    }
  }
  const endTime = new Date();
  const timeTaken = endTime - startTime;
  console.log(`${timeTaken} ms`);
}

module.exports = {
  splitJobs,
};
