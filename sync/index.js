const { getSql } = require("../utils/databaseConnection");
const { getAccountingData } = require("./getAccountingData");
const { getReferences } = require("./getReferences");
const { postFinancials } = require("./postFinancials");

async function syncEnterprise() {
  const sql = await getSql();
  const distinctSync =
    await sql.query`select distinct syncNumber from test.enterprise order by syncNumber desc`;
  let currentSyncNumber = parseInt(distinctSync.recordset[distinctSync.recordset.length - 1].syncNumber);
  let syncNumberToSet = distinctSync.recordset.length === 1 ? parseInt(distinctSync.recordset[0].syncNumber, 10) + 1 : parseInt(distinctSync.recordset[0].syncNumber, 10)
  const job =
    await sql.query`select top(1) * from test.enterprise where syncNumber = ${currentSyncNumber}`;
  const enterprise = job.recordset[0];
  console.log(
    `syncEnterprise() - ${enterprise.guid} - ${enterprise.enterpriseNumberString}`
  );
  console.time("Total time")
  console.time(` => getReferences()`);
  const references = await getReferences(enterprise, sql);
  console.timeEnd(" => getReferences()");
  console.time(` => getAccountingData()`);
  const accountingDataArr = await getAccountingData(references, sql);
  console.timeEnd(" => getAccountingData()");
  console.time(` => postFinancials()`);
  await postFinancials(enterprise, accountingDataArr, sql);
  console.timeEnd(" => postFinancials()");
  console.timeEnd("Total time")
  console.log();
  await sql.query`update test.enterprise set syncNumber = ${syncNumberToSet}, lastSync = ${new Date()} where guid = ${enterprise.guid}`
}

module.exports = {
  syncEnterprise,
};
