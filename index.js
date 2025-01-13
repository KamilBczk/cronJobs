const cron = require("node-cron");
require("dotenv").config();
const { getSql } = require("./utils/databaseConnection");
const { getFinancials } = require("./getFinancials");
const { connectToMongoDB } = require("./config/mongodb");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debug = process.env.ENV === "local" ? true : false;

async function getJobs(sql) {
  const jobs =
    await sql.query`SELECT TOP (20) * FROM [cronJobs].[enterprises] order by lastFinancialSync asc`;
  return jobs.recordset;
}

let jobs = [];

(async () => {
  while (true) {
    try {
      await connectToMongoDB();
      const sql = await getSql();
      if (jobs.length === 0) {
        jobs = await getJobs(sql);
      } else {
        const enterpriseNumbers = [];
        for (const enterprise of jobs) {
          console.log(enterprise.enterpriseNumber);
          await getFinancials(enterprise);
          enterpriseNumbers.push(enterprise.enterpriseNumber);
        }
        if (enterpriseNumbers.length > 0) {
          for (const enterpriseNumber of enterpriseNumbers) {
            await sql.query`
              UPDATE [cronJobs].[enterprises] 
              SET lastFinancialSync = GETDATE()
              WHERE enterpriseNumber = ${enterpriseNumber}
            `;
          }
        }
        jobs = [];
      }
    } catch (e) {
      console.log(e);
    }
  }
})();
