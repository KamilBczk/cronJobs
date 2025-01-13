const { getAccountingData } = require("./sync/getAccountingData");
const { getReferences } = require("./sync/getReferences");
const { postFinancials } = require("./sync/postFinancials");

async function getFinancials(enterprise) {
  const enterpriseNumber = enterprise.enterpriseNumber;
  const enterpriseNumberString = enterprise.enterpriseNumberString;

  const references = await getReferences(enterpriseNumberString);
  const accountingData = await getAccountingData(references);

  await postFinancials(enterpriseNumber, accountingData);

  return true;
}

module.exports = {
  getFinancials,
};
