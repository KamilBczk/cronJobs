const { v4: uuidv4 } = require("uuid");

async function postFinancials(enterprise, accountingDataArr, sql) {
  console.log(enterprise.guid);
  const financialInDatabase =
    await sql.query`select guid, reference from cbso.financial where entityId = ${enterprise.guid} AND entityType = 'enterprise'`;
  console.log("done check financial in db");
  for (let i = 0; i < accountingDataArr.length; i++) {
    const element = accountingDataArr[i];
    if (await checkDoubles(element.referenceData, financialInDatabase, sql))
      await addToDatabase(enterprise, element, sql);
  }
}

async function checkDoubles(referenceData, financialInDatabase, sql) {
  const exists = financialInDatabase.recordset.some(
    (record) => record.reference === referenceData.referenceNumber
  );
  if (exists) return false;
  else {
    const sameYearRecords = financialInDatabase.recordset.filter((record) =>
      record.reference.startsWith(referenceData.referenceNumberYear)
    );

    if (sameYearRecords.length > 0) {
      for (let i = 0; i < sameYearRecords.length; i++) {
        const element = sameYearRecords[i];
        console.log("delete");
        await sql.query`delete from cbso.financial where guid = ${element.guid}`;
      }
    }
    return true;
  }
}

async function addToDatabase(enterprise, accountingData, sql) {
  const referenceData = accountingData.referenceData;
  accountingData = accountingData.data;
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
  requestN.input("createdOn", sql.DateTime, new Date());
  requestN.input("updatedOn", sql.DateTime, new Date());
  requestN.input("entityId", sql.UniqueIdentifier, enterprise.guid);
  requestN.input("entityType", sql.VarChar(20), "enterprise");
  requestN.input("reference", sql.VarChar(50), referenceData.referenceNumber);
  requestN.input("depositDate", sql.DateTime, referenceData.depositDate);
  requestN.input(
    "exerciseStartDate",
    sql.DateTime,
    referenceData.exerciseStartDate
  );
  requestN.input(
    "exerciseEndDate",
    sql.DateTime,
    referenceData.exerciseEndDate
  );
  requestN.input("period", sql.VarChar(50), "N");
  requestN.input("data", sql.VarChar(sql.MAX), JSON.stringify(groupedData.N));
  await requestN.query(
    "INSERT INTO cbso.financial (guid, createdOn, updatedOn, entityId, entityType, reference, depositDate, exerciseStartDate, exerciseEndDate, period, data) VALUES (@guid, @createdOn, @updatedOn, @entityId, @entityType, @reference, @depositDate, @exerciseStartDate, @exerciseEndDate, @period, @data)"
  );
  if (groupedData.NM1) {
    const requestNM1 = new sql.Request();
    requestNM1.input("guid", sql.UniqueIdentifier, uuidv4());
    requestNM1.input("createdOn", sql.DateTime, new Date());
    requestNM1.input("updatedOn", sql.DateTime, new Date());
    requestNM1.input("entityId", sql.UniqueIdentifier, enterprise.guid);
    requestNM1.input("entityType", sql.VarChar(20), "enterprise");
    requestNM1.input(
      "reference",
      sql.VarChar(50),
      referenceData.referenceNumber
    );
    requestNM1.input("depositDate", sql.DateTime, referenceData.depositDate);
    requestNM1.input(
      "exerciseStartDate",
      sql.DateTime,
      referenceData.exerciseStartDate
    );
    requestNM1.input(
      "exerciseEndDate",
      sql.DateTime,
      referenceData.exerciseEndDate
    );
    requestNM1.input("period", sql.VarChar(50), "NM1");
    requestNM1.input(
      "data",
      sql.VarChar(sql.MAX),
      JSON.stringify(groupedData.NM1)
    );
    await requestNM1.query(
      "INSERT INTO cbso.financial (guid, createdOn, updatedOn, entityId, entityType, reference, depositDate, exerciseStartDate, exerciseEndDate, period, data) VALUES (@guid, @createdOn, @updatedOn, @entityId, @entityType, @reference, @depositDate, @exerciseStartDate, @exerciseEndDate, @period, @data)"
    );
  }
}

module.exports = {
  postFinancials,
};
