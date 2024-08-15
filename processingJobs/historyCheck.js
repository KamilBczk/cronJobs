const { getSql } = require("../utils/databaseConnection");
const { v4: uuidv4 } = require("uuid");
const { getBelgiumTime } = require("../utils/time");

async function historyCheck(record) {
  const body = JSON.parse(record.data);
  const sql = await getSql();
  const financial =
    await sql.query`select guid, reference from cbso.financial where entityNumber = ${body.enterpriseNumber}`;
  const allowedYears = ["2021", "2022", "2023", "2024"];
  const presentYears = new Set();

  financial.recordset.forEach((item) => {
    const year = item.reference.split("-")[0];
    if (allowedYears.includes(year)) {
      presentYears.add(year);
    }
  });

  const missingYears = allowedYears.filter((year) => !presentYears.has(year));
  for (let i = 0; i < missingYears.length; i++) {
    const element = missingYears[i];
    const url = `https://ws.cbso.nbb.be/authentic/legalEntity/${
      body.enterpriseNumber
    }/references?year=${element - 1}`;
    const referenceDataResponse = await fetch(url, {
      headers: {
        "X-Request-Id": uuidv4(),
        Accept: "application/json",
        "NBB-CBSO-Subscription-Key": process.env.CSBO_AUTHENTIC_TOKEN,
      },
    });
    if (!referenceDataResponse.ok) {
    } else {
      let referenceData = await referenceDataResponse.json();
      if (referenceData.length > 1) {
        referenceData = referenceData.reduce((maxItem, currentItem) => {
          const maxNum = parseInt(maxItem.ReferenceNumber.split("-")[1], 10);
          const currentNum = parseInt(
            currentItem.ReferenceNumber.split("-")[1],
            10
          );
          return currentNum > maxNum ? currentItem : maxItem;
        });
      } else {
        referenceData = referenceData[0];
      }
      if (
        !(
          referenceData.AccountingDataURL === null ||
          referenceData.AccountingDataURL === undefined
        )
      ) {
        const jsonSaveDb = {
          referenceNumber: referenceData.ReferenceNumber,
          depositDate: referenceData.DepositDate,
          exerciseStartDate: referenceData.ExerciseDates.startDate,
          exerciseEndDate: referenceData.ExerciseDates.endDate,
          enterpriseNumber: referenceData.EnterpriseNumber,
          accountingDataURL: referenceData.AccountingDataURL,
        };
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
      }
    }
  }
  sql.query`update cbso.jobs set status = 'done' where guid = ${record.guid}`;
}

module.exports = {
  historyCheck,
};
