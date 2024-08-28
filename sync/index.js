const { getSql } = require("../utils/databaseConnection");
const { getAccountingData } = require("./getAccountingData");
const { getReferences } = require("./getReferences");
const { postFinancials } = require("./postFinancials");

async function syncEnterprise(currentSyncNumber, syncNumberToSet, sql, debug) {
  let job =
    await sql.query`select top(1) * from test.enterprise where syncNumber = ${currentSyncNumber}`;
  if (job.recordset.length === 0) return false;
  if (debug === true)
    job.recordset[0] = {
      guid: "59C05626-3D17-447F-A01D-0010C5351A5C",
      createdOn: "2024-08-19T17:15:38.200Z",
      updatedOn: "2024-08-19T17:15:38.200Z",
      enterpriseNumber: "723910604",
      enterpriseNumberString: "0723.910.604",
      syncNumber: "0",
      lastSync: null,
    };
  const enterprise = job.recordset[0];
  console.log(
    `syncEnterprise() - ${enterprise.guid} - ${enterprise.enterpriseNumberString}`
  );
  console.time("Total time");
  console.time(` => getReferences()`);
  const references = await getReferences(enterprise, sql);
  console.timeEnd(" => getReferences()");
  console.time(` => getAccountingData()`);
  const accountingDataArr = await getAccountingData(references, sql);
  console.timeEnd(" => getAccountingData()");
  console.time(` => postFinancials()`);
  await postFinancials(enterprise, accountingDataArr, sql);
  console.timeEnd(" => postFinancials()");
  console.timeEnd("Total time");
  console.log();
  if (debug !== true)
    await sql.query`update test.enterprise set syncNumber = ${syncNumberToSet}, lastSync = ${new Date()} where guid = ${
      enterprise.guid
    }`;
  return true;
}

module.exports = {
  syncEnterprise,
};
