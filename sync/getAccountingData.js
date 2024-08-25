const { v4: uuidv4 } = require("uuid");

async function getAccountingData(references, sql) {
  const yearsToFetch = references.yearsToFetch;
  let allAccountingData = [];
  for (let i = 0; i < yearsToFetch.length; i++) {
    const element = references[yearsToFetch[i]];
    element.forEach((item) => {
      const accountingDataToPush = {
        referenceNumber: item.ReferenceNumber,
        referenceNumberYear: item.ReferenceNumber.split("-")[0],
        referenceNumberCount: item.ReferenceNumber.split("-")[1],
        depositDate: item.DepositDate,
        exerciseStartDate: item.ExerciseDates.startDate,
        exerciseEndDate: item.ExerciseDates.endDate,
        accountingDataUrl: item.AccountingDataURL,
      };
      if (accountingDataToPush.accountingDataUrl !== null)
        allAccountingData.push(accountingDataToPush);
    });
  }

  const accountingData = await getValidAccountingData(allAccountingData);
  return accountingData;
}

async function getValidAccountingData(allAccountingData) {
  // Trier les données en ordre décroissant par année et par numéro de référence
  allAccountingData.sort((a, b) => {
    if (a.referenceNumberYear !== b.referenceNumberYear) {
      return b.referenceNumberYear.localeCompare(a.referenceNumberYear);
    }
    return b.referenceNumberCount.localeCompare(a.referenceNumberCount);
  });

  let validAccountingData = [];
  let previousYear = null;

  for (let i = 0; i < allAccountingData.length; i++) {
    const item = allAccountingData[i];
    if (previousYear && item.referenceNumberYear !== previousYear) {
      previousYear = item.referenceNumberYear; // Met à jour pour la nouvelle année
    } else if (previousYear === item.referenceNumberYear) {
      continue;
    }

    try {
      const response = await fetch(item.accountingDataUrl, {
        headers: {
          "X-Request-Id": uuidv4(),
          Accept: "application/x.jsonxbrl",
          "NBB-CBSO-Subscription-Key": process.env.CSBO_AUTHENTIC_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${item.referenceNumber}`);
      }

      const data = await response.json();
      validAccountingData.push(data); // Ajoute les données réussies au tableau
      //   console.log(`Data fetched successfully for ${item.referenceNumber}`);

      previousYear = item.referenceNumberYear;
    } catch (error) {
      console.error(error.message);
    }
  }
  return validAccountingData;
}

module.exports = {
  getAccountingData,
};
