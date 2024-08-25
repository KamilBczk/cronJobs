const { getSql } = require("../utils/databaseConnection");
const { getAccountingData } = require("./getAccountingData");
const { getReferences } = require("./getReferences");
const { postFinancials } = require("./postFinancials");

async function syncEnterprise(debug) {
  const sql = await getSql();
  const distinctSync =
    await sql.query`select distinct syncNumber from test.enterprise order by syncNumber desc`;
  let currentSyncNumber = parseInt(distinctSync.recordset[distinctSync.recordset.length - 1].syncNumber);
  let syncNumberToSet = distinctSync.recordset.length === 1 ? parseInt(distinctSync.recordset[0].syncNumber, 10) + 1 : parseInt(distinctSync.recordset[0].syncNumber, 10)
  let job =
    await sql.query`select top(1) * from test.enterprise where syncNumber = ${currentSyncNumber}`;
  if (debug === true)
    job.recordset[0] = {
      guid: '59C05626-3D17-447F-A01D-0010C5351A5C',
      createdOn: '2024-08-19T17:15:38.200Z',
      updatedOn: '2024-08-19T17:15:38.200Z',
      enterpriseNumber: '723910604',
      enterpriseNumberString: '0723.910.604',
      syncNumber: '0',
      lastSync: null
    }
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
  if (debug !== true)
    await sql.query`update test.enterprise set syncNumber = ${syncNumberToSet}, lastSync = ${new Date()} where guid = ${enterprise.guid}`
}

module.exports = {
  syncEnterprise,
};
