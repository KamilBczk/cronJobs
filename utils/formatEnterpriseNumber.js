function formatEnterpriseNumberToString(enterpriseNumber) {
  let enterpriseNumberToReturn = "";
  for (let i = 0; i < enterpriseNumber.length; i++) {
    const element = enterpriseNumber[i];
    enterpriseNumberToReturn += element;
    if (i === 3 || i === 6) enterpriseNumberToReturn += ".";
  }
  return enterpriseNumberToReturn;
}

module.exports = {
  formatEnterpriseNumberToString,
};
