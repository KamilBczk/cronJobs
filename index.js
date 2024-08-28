const cron = require("node-cron");
require("dotenv").config();
const { getSql } = require("./utils/databaseConnection");
const { syncEnterprise } = require("./sync");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debug = process.env.ENV === "local" ? true : false;

async function getSyncNumber(sql) {
  console.log("checking sync number");
  const distinctSync =
    await sql.query`select distinct syncNumber from test.enterprise order by syncNumber desc`;
  let currentSyncNumber = parseInt(
    distinctSync.recordset[distinctSync.recordset.length - 1].syncNumber
  );
  let syncNumberToSet =
    distinctSync.recordset.length === 1
      ? parseInt(distinctSync.recordset[0].syncNumber, 10) + 1
      : parseInt(distinctSync.recordset[0].syncNumber, 10);
  return { currentSyncNumber: currentSyncNumber, syncNumberToSet };
}

let i = 0;
let checkSyncNumber = true;
let currentSyncNumber;
let syncNumberToSet;

(async () => {
  while (true) {
    try {
      const sql = await getSql();

      if (checkSyncNumber) {
        const syncNumbers = await getSyncNumber(sql);
        currentSyncNumber = syncNumbers.currentSyncNumber;
        syncNumberToSet = syncNumbers.syncNumberToSet;
        checkSyncNumber = false;
      }
      console.log(`${i}: ${currentSyncNumber}, ${syncNumberToSet}`);
      if (
        !(await syncEnterprise(checkSyncNumber, syncNumberToSet, sql, debug))
      ) {
        checkSyncNumber = true;
      }
      if (i % 100 === 0) checkSyncNumber = true;
      i++;
      if (debug === true) break;
    } catch (e) {
      console.log(e);
    }
  }
})();
