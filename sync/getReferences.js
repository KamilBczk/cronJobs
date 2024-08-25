const { v4: uuidv4 } = require("uuid");

async function getReferences(enterprise, sql) {
  let yearsToFetch = getYearsToFetch();

  let reference = {};
  reference.yearsToFetch = yearsToFetch;
  for (let i = 0; i < yearsToFetch.length; i++) {
    const element = yearsToFetch[i];
    reference[element] = await getReference(
      enterprise.enterpriseNumberString.replaceAll(".", ""),
      element
    );
  }
  return reference;
}

async function getReference(enterpriseNumber, year) {
  const url = `https://ws.cbso.nbb.be/authentic/legalEntity/0402206045/references?year=${year}`;
  const reference = await fetch(url, {
    headers: {
      "X-Request-Id": uuidv4(),
      Accept: "application/json",
      "NBB-CBSO-Subscription-Key": process.env.CSBO_AUTHENTIC_TOKEN,
    },
  });
  return await reference.json();
}

function getYearsToFetch() {
  const currentYear = new Date().getFullYear();
  const startYear = 2021;
  let years = [];

  for (let year = currentYear - 1; year >= startYear; year--) {
    years.push(year.toString());
  }
  return years;
}

module.exports = {
  getReferences,
  getYearsToFetch,
};
