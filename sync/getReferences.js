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
  const url = `https://ws.cbso.nbb.be/authentic/legalEntity/${enterpriseNumber}/references?year=${year}`;
  try {
    const response = await fetch(url, {
      headers: {
        "X-Request-Id": uuidv4(),
        Accept: "application/json",
        "NBB-CBSO-Subscription-Key": process.env.CSBO_AUTHENTIC_TOKEN,
      },
    });

    // Vérifiez si la réponse est OK (code de statut HTTP 200-299)
    if (!response.ok) {
      //console.error(`Erreur lors de la récupération des données : ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    //console.error(`Erreur de requête : ${error.message}`);
    return null;
  }
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
