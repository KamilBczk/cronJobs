const { getSql } = require("../utils/databaseConnection");
const { v4: uuidv4 } = require("uuid");
const { getBelgiumTime } = require("../utils/time");
const { relations } = require("./relations");

async function accountingData(record) {
  const body = JSON.parse(record.data);
  const sql = await getSql();
  const financial =
    await sql.query`select guid, reference from cbso.financial where entityNumber = ${body.enterpriseNumber}`;
  const exists = financial.recordset.some(
    (record) => record.reference === body.referenceNumber
  );

  if (!exists) {
    const url = `https://ws.cbso.nbb.be/authentic/deposit/${body.referenceNumber}/accountingData`;
    const accountingDataResponse = await fetch(url, {
      headers: {
        "X-Request-Id": uuidv4(),
        Accept: "application/x.jsonxbrl",
        "NBB-CBSO-Subscription-Key": process.env.CSBO_AUTHENTIC_TOKEN,
      },
    });
    if (!accountingDataResponse.ok) {
      sql.query`update cbso.jobs set status = 'error-404' where guid = ${record.guid}`;
      return;
    }
    const accountingData = await accountingDataResponse.json();
    await relations(accountingData, body);
    const groupedData = accountingData.Rubrics.reduce((acc, item) => {
      if (item.Period === "N" || item.Period === "NM1") {
        if (!acc[item.Period]) {
          acc[item.Period] = [];
        }
        acc[item.Period].push({
          Code: item.Code,
          Value: item.Value,
        });
      }
      return acc;
    }, {});

    const requestN = new sql.Request();
    requestN.input("guid", sql.UniqueIdentifier, uuidv4());
    requestN.input("createdOn", sql.DateTime, getBelgiumTime());
    requestN.input("updatedOn", sql.DateTime, getBelgiumTime());
    requestN.input("entityNumber", sql.Int, body.enterpriseNumber);
    requestN.input("reference", sql.VarChar(50), body.referenceNumber);
    requestN.input("depositDate", sql.DateTime, body.depositDate);
    requestN.input("exerciseStartDate", sql.DateTime, body.exerciseStartDate);
    requestN.input("exerciseEndDate", sql.DateTime, body.exerciseEndDate);
    requestN.input("period", sql.VarChar(50), "N");
    requestN.input("data", sql.VarChar(sql.MAX), JSON.stringify(groupedData.N));
    // await requestN.query(
    //   "INSERT INTO cbso.financial (guid, createdOn, updatedOn, entityNumber, reference, depositDate, exerciseStartDate, exerciseEndDate, period, data) VALUES (@guid, @createdOn, @updatedOn, @entityNumber, @reference, @depositDate, @exerciseStartDate, @exerciseEndDate, @period, @data)"
    // );
    if (groupedData.NM1) {
      const requestNM1 = new sql.Request();
      requestNM1.input("guid", sql.UniqueIdentifier, uuidv4());
      requestNM1.input("createdOn", sql.DateTime, getBelgiumTime());
      requestNM1.input("updatedOn", sql.DateTime, getBelgiumTime());
      requestNM1.input("entityNumber", sql.Int, body.enterpriseNumber);
      requestNM1.input("reference", sql.VarChar(50), body.referenceNumber);
      requestNM1.input("depositDate", sql.DateTime, body.depositDate);
      requestNM1.input(
        "exerciseStartDate",
        sql.DateTime,
        body.exerciseStartDate
      );
      requestNM1.input("exerciseEndDate", sql.DateTime, body.exerciseEndDate);
      requestNM1.input("period", sql.VarChar(50), "NM1");
      requestNM1.input(
        "data",
        sql.VarChar(sql.MAX),
        JSON.stringify(groupedData.NM1)
      );

      // await requestNM1.query(
      //   "INSERT INTO cbso.financial (guid, createdOn, updatedOn, entityNumber, reference, depositDate, exerciseStartDate, exerciseEndDate, period, data) VALUES (@guid, @createdOn, @updatedOn, @entityNumber, @reference, @depositDate, @exerciseStartDate, @exerciseEndDate, @period, @data)"
      // );
    }
  }
  // sql.query`update cbso.jobs set status = 'done' where guid = ${record.guid}`;
}

module.exports = {
  accountingData,
};
