const { getSql } = require("../utils/databaseConnection");
const JSZip = require("jszip");
const { v4: uuidv4 } = require("uuid");
const { getBelgiumTime } = require("../utils/time");

async function dailyExtract() {
  const sql = await getSql();
  const date = getBelgiumTime();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate() - 1).padStart(2, "0");
  if (!process.env.CSBO_EXTRACTS_TOKEN) {
    throw new Error("CSBO_EXTRACTS_TOKEN is not defined");
  }

  const formattedDate = `${year}-${month}-${day}`;
  const url = `https://ws.cbso.nbb.be/extracts/batch/${formattedDate}/`;
  const referencesResponse = await fetch(url + "references", {
    headers: {
      "X-Request-Id": uuidv4(),
      Accept: "application/x.zip+json",
      "NBB-CBSO-Subscription-Key": process.env.CSBO_EXTRACTS_TOKEN,
    },
  });

  if (!referencesResponse.ok) {
    //TODO: Handle some error
    throw new Error(
      `Failed to fetch references: ${referencesResponse.statusText}`
    );
  }

  const referencesBuffer = await referencesResponse.arrayBuffer();
  const referencesZip = new JSZip();
  const referencesContent = await referencesZip.loadAsync(referencesBuffer);
  let referencesCount = 0;
  let referencesCountWithAccountingDataUrl = 0;
  for (const fileName of Object.keys(referencesContent.files)) {
    if (fileName.endsWith(".json")) {
      const file = referencesContent.files[fileName];
      const fileData = await file.async("string");
      const jsonData = JSON.parse(fileData);
      if (
        !(
          jsonData.accountingDataURL === null ||
          jsonData.accountingDataURL === undefined
        )
      ) {
        const jsonSaveDb = {
          referenceNumber: jsonData.referenceNumber,
          depositDate: jsonData.depositDate,
          exerciseStartDate: jsonData.exerciseDates.startDate,
          exerciseEndDate: jsonData.exerciseDates.endDate,
          enterpriseNumber: jsonData.enterpriseNumber,
          accountingDataURL: jsonData.accountingDataURL,
        };
        referencesCountWithAccountingDataUrl += 1;
        const request = new sql.Request();
        request.input("guid", sql.UniqueIdentifier, uuidv4());
        request.input("createdOn", sql.DateTime, getBelgiumTime());
        request.input("updatedOn", sql.DateTime, getBelgiumTime());
        request.input("status", sql.VarChar(50), "todo");
        request.input("type", sql.VarChar(50), "accountingData");
        request.input("data", sql.VarChar(sql.MAX), JSON.stringify(jsonSaveDb));
        await request.query(
          "INSERT INTO cbso.jobs (guid, createdOn, updatedOn, status, type, data) VALUES (@guid, @createdOn, @updatedOn, @status, @type, @data)"
        );

        const historyRequest = new sql.Request();
        historyRequest.input("guid", sql.UniqueIdentifier, uuidv4());
        historyRequest.input("createdOn", sql.DateTime, getBelgiumTime());
        historyRequest.input("updatedOn", sql.DateTime, getBelgiumTime());
        historyRequest.input("status", sql.VarChar(50), "todo");
        historyRequest.input("type", sql.VarChar(50), "historyCheck");
        historyRequest.input(
          "data",
          sql.VarChar(sql.MAX),
          JSON.stringify({ enterpriseNumber: jsonData.enterpriseNumber })
        );
        await historyRequest.query(
          "INSERT INTO cbso.jobs (guid, createdOn, updatedOn, status, type, data) VALUES (@guid, @createdOn, @updatedOn, @status, @type, @data)"
        );
      }
      referencesCount += 1;
    }
  }
  console.log("Fichiers references : " + referencesCount);
}

module.exports = {
  dailyExtract,
};
