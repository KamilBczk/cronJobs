const { getSql } = require("../utils/databaseConnection");
const { getAccountingData } = require("./getAccountingData");
const { getReferences } = require("./getReferences");
const { postFinancials } = require("./postFinancials");

async function syncEnterprise() {
  const sql = await getSql();
  const syncNumber =
    await sql.query`select distinct syncNumber from test.enterprise`;
  const job =
    await sql.query`select top(1) * from test.enterprise where syncNumber = '0'`;
  const enterprise = job.recordset[0];
  console.log(
    `Sync - ${enterprise.guid} - ${enterprise.enterpriseNumberString}`
  );
  console.time(`\t => getReferences()`);
  const references = await getReferences(enterprise, sql);
  console.timeEnd("\t => getReferences()");
  console.time(`\t => getAccountingData()`);
  const accountingDataURLS = await getAccountingData(references, sql);
  console.timeEnd("\t => getAccountingData()");
  await postFinancials(accountingDataURLS, sql);
}

module.exports = {
  syncEnterprise,
};
