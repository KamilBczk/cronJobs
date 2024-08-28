const { getSql } = require("../utils/databaseConnection");
const { getAccountingData } = require("./getAccountingData");
const { getReferences } = require("./getReferences");
const { postAdministrators } = require("./postAdministrators");
const { postFinancials } = require("./postFinancials");

async function syncEnterprise(currentSyncNumber, syncNumberToSet, sql, debug) {
  console.log(currentSyncNumber);
  let job =
    await sql.query`select top(1) * from test.enterprise where syncNumber = ${currentSyncNumber}`;
  if (job.recordset.length === 0) return false;
  if (debug === true)
    job.recordset[0] = {
      guid: "B925FDCF-9CD7-4FCC-9EAD-F7C6C1FDA766",
      createdOn: "2024-08-19T17:15:38.200Z",
      updatedOn: "2024-08-19T17:15:38.200Z",
      enterpriseNumber: "403275718",
      enterpriseNumberString: "0403.275.718",
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
  console.time(` => postAdministrators()`);
  await postAdministrators(accountingDataArr[0], enterprise, sql);
  console.timeEnd(` => postAdministrators()`);
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
