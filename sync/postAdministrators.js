const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { deleteRelations, createRelation } = require("./utils/relations");

async function postAdministrators(accountingData, enterprise, sql) {
  if (accountingData === undefined) return;
  const administrators = accountingData.data.Administrators;
  const shareholders = accountingData.data.Shareholders;

  const currentCompany = enterprise;
  for (let i = 0; i < administrators.LegalPersons.length; i++) {
    const element = administrators.LegalPersons[i];
    let identifier = parseInt(element.Entity.Identifier);

    let childCompany;
    if (!Number.isNaN(identifier)) {
      try {
        childCompany =
          await sql.query`select * from prod.enterprise where enterpriseNumber = ${identifier}`;
      } catch (e) {
        childCompany = null;
      }
    }

    if (childCompany && childCompany.recordset.length === 1) {
      if (i === 0)
        await deleteRelations(sql, currentCompany.guid, "ADMINISTRATOR_PARENT");
      const id1 = childCompany.recordset[0].guid;
      const id2 = currentCompany.guid;

      const additionalInfo = { mandates: [], representatives: [] };
      element.Mandates.forEach((elem) => {
        additionalInfo.mandates.push({
          functionMandate: elem.FunctionMandate,
          otherFunctionMandate: elem.OtherFunctionMandate,
          startDate: elem.MandateDates.StartDate,
          endDate: elem.MandateDates.EndDate,
        });
      });
      element.Representatives.forEach((elem) => {
        additionalInfo.representatives.push({
          firstName: elem.FirstName,
          lastName: elem.LastName,
          profession: elem.Profession,
          address: {
            street: elem.Address.Street,
            number: elem.Address.Number,
            box: elem.Address.Box,
            city: elem.Address.City,
            otherPostalCode: elem.Address.OtherPostalCode,
            otherCity: elem.Address.OtherCity,
            country: elem.Address.Country,
            otherCountry: elem.Address.OtherCountry,
            addressType: elem.Address.AddressType,
            otherAddressType: elem.Address.OtherAddressType,
          },
        });
      });
      await createRelation(
        sql,
        id1,
        "bce.enterprise",
        id2,
        "bce.enterprise",
        "ADMINISTRATOR_PARENT",
        "ADMINISTRATOR_CHILD",
        JSON.stringify(additionalInfo)
      );
    } else {
      const currentHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(element.Entity))
        .digest("hex");
      const findParty =
        await sql.query`select * from cbso.party where hash = ${currentHash}`;
      let guid;

      if (findParty.recordset.length === 1) {
        guid = findParty.recordset[0].guid;
      } else {
        guid = uuidv4();
        const request = new sql.Request();
        request.input("guid", sql.UniqueIdentifier, guid);
        request.input("createdOn", sql.DateTime, new Date());
        request.input("updatedOn", sql.DateTime, new Date());
        request.input("hash", sql.VarChar(64), currentHash);
        request.input("type", sql.VarChar(50), "LEGAL");
        request.input(
          "additionalInfo",
          sql.VarChar(sql.MAX),
          JSON.stringify({
            entity: {
              name: element.Entity.Name,
              identifier: element.Entity.Identifier,
              identifierKindOfNumber:
                element.Entity.IdentifierKindOfNumber.IdentifierKindOfNumber,
              identifierKindOfNumberCode:
                element.Entity.IdentifierKindOfNumber
                  .IdentifierKindOfNumberCode,
              address: {
                street: element.Entity.Address.Street,
                number: element.Entity.Address.Number,
                box: element.Entity.Address.Box,
                city: element.Entity.Address.City,
                otherPostalCode: element.Entity.Address.OtherPostalCode,
                otherCity: element.Entity.Address.OtherCity,
                country: element.Entity.Address.Country,
                otherCountry: element.Entity.Address.OtherCountry,
                addressType: element.Entity.Address.AddressType,
                otherAddressType: element.Entity.Address.OtherAddressType,
              },
            },
          })
        );
        await request.query(
          `INSERT INTO cbso.party
            (guid, createdOn, updatedOn, hash, type, additionalInfo) VALUES
            (@guid, @createdOn, @updatedOn, @hash, @type, @additionalInfo)`
        );
      }

      const additionalInfo = { mandates: [] };
      element.Mandates.forEach((elem) => {
        additionalInfo.mandates.push({
          functionMandate: elem.FunctionMandate,
          otherFunctionMandate: elem.OtherFunctionMandate,
          startDate: elem.MandateDates.StartDate,
          endDate: elem.MandateDates.EndDate,
        });
      });
      await createRelation(
        sql,
        guid,
        "cbso.party",
        currentCompany.guid,
        "bce.enterprise",
        "ADMINISTRATOR_PARENT",
        "ADMINISTRATOR_CHILD",
        JSON.stringify(additionalInfo)
      );
    }
  }
  for (let i = 0; i < administrators.NaturalPersons.length; i++) {
    const element = administrators.NaturalPersons[i];
    const currentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(element.Person))
      .digest("hex");
    const findPerson =
      await sql.query`select * from cbso.party where hash = ${currentHash}`;
    let personGuid;
    if (findPerson.recordset.length === 0) {
      personGuid = uuidv4();
      const request = new sql.Request();
      request.input("guid", sql.UniqueIdentifier, personGuid);
      request.input("createdOn", sql.DateTime, new Date());
      request.input("updatedOn", sql.DateTime, new Date());
      request.input("hash", sql.VarChar(64), currentHash);
      request.input("type", sql.VarChar(50), "PHYSICAL");
      request.input(
        "additionalInfo",
        sql.VarChar(sql.MAX),
        JSON.stringify({
          person: {
            firstName: element.Person.FirstName,
            lastName: element.Person.LastName,
            profession: element.Profession,
          },
          address: {
            street: element.Person.Address.Street,
            number: element.Person.Address.Number,
            box: element.Person.Address.Box,
            city: element.Person.Address.City,
            otherPostalCode: element.Person.Address.OtherPostalCode,
            otherCity: element.Person.Address.OtherCity,
            country: element.Person.Address.Country,
            otherCountry: element.Person.Address.OtherCountry,
            addressType: element.Person.Address.AddressType,
            otherAddressType: element.Person.Address.OtherAddressType,
          },
        })
      );
      await request.query(
        `INSERT INTO cbso.party
            (guid, createdOn, updatedOn, hash, type, additionalInfo) VALUES
            (@guid, @createdOn, @updatedOn, @hash, @type, @additionalInfo)`
      );
    } else {
      personGuid = findPerson.recordset[0].guid;
    }
    const additionalInfo = { mandates: [] };
    element.Mandates.forEach((elem) => {
      additionalInfo.mandates.push({
        functionMandate: elem.FunctionMandate,
        otherFunctionMandate: elem.OtherFunctionMandate,
        startDate: elem.MandateDates.StartDate,
        endDate: elem.MandateDates.EndDate,
      });
    });
    await createRelation(
      sql,
      personGuid,
      "cbso.party",
      currentCompany.guid,
      "bce.enterprise",
      "ADMINISTRATOR_PARENT",
      "ADMINISTRATOR_CHILD",
      JSON.stringify(additionalInfo)
    );
  }
  for (let i = 0; i < shareholders.EntityShareHolders.length; i++) {
    const element = shareholders.EntityShareHolders[i];
    const identifier = parseInt(element.Entity.Identifier);

    let childCompany;
    if (!Number.isNaN(identifier)) {
      try {
        childCompany =
          await sql.query`select * from prod.enterprise where enterpriseNumber = ${identifier}`;
      } catch (e) {
        childCompany = null;
      }
    }
    if (childCompany && childCompany.recordset.length === 1) {
      if (i === 0)
        await deleteRelations(sql, currentCompany.guid, "SHAREHOLDER_PARENT");
      const additionalInfo = { rightsHeld: [] };
      element.RightsHeld.forEach((elem) => {
        additionalInfo.rightsHeld.push({
          line: elem.Line,
          nature: elem.Nature,
          numberSecuritiesAttached: elem.NumberSecuritiesAttached,
          numberNotSecuritiesAttached: elem.NumberNotSecuritiesAttached,
          percentage: elem.Percentage,
        });
      });
      await createRelation(
        sql,
        childCompany.recordset[0].guid,
        "bce.enterprise",
        currentCompany.guid,
        "bce.enterprise",
        "SHAREHOLDER_PARENT",
        "SHAREHOLDER_CHILD",
        JSON.stringify(additionalInfo)
      );
    } else {
      const currentHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(element.Entity))
        .digest("hex");
      const findParty =
        await sql.query`select * from cbso.party where hash = ${currentHash}`;
      let guid;

      if (findParty.recordset.length === 1) {
        guid = findParty.recordset[0].guid;
      } else {
        guid = uuidv4();
        const request = new sql.Request();
        request.input("guid", sql.UniqueIdentifier, guid);
        request.input("createdOn", sql.DateTime, new Date());
        request.input("updatedOn", sql.DateTime, new Date());
        request.input("hash", sql.VarChar(64), currentHash);
        request.input("type", sql.VarChar(50), "LEGAL");
        request.input(
          "additionalInfo",
          sql.VarChar(sql.MAX),
          JSON.stringify({
            entity: {
              name: element.Entity.Name,
              identifier: element.Entity.Identifier,
              identifierKindOfNumber:
                element.Entity.IdentifierKindOfNumber.IdentifierKindOfNumber,
              identifierKindOfNumberCode:
                element.Entity.IdentifierKindOfNumber
                  .IdentifierKindOfNumberCode,
              address: {
                street: element.Entity.Address.Street,
                number: element.Entity.Address.Number,
                box: element.Entity.Address.Box,
                city: element.Entity.Address.City,
                otherPostalCode: element.Entity.Address.OtherPostalCode,
                otherCity: element.Entity.Address.OtherCity,
                country: element.Entity.Address.Country,
                otherCountry: element.Entity.Address.OtherCountry,
                addressType: element.Entity.Address.AddressType,
                otherAddressType: element.Entity.Address.OtherAddressType,
              },
            },
          })
        );
        await request.query(
          `INSERT INTO cbso.party
            (guid, createdOn, updatedOn, hash, type, additionalInfo) VALUES
            (@guid, @createdOn, @updatedOn, @hash, @type, @additionalInfo)`
        );
      }
      const additionalInfo = { rightsHeld: [] };
      element.RightsHeld.forEach((elem) => {
        additionalInfo.rightsHeld.push({
          line: elem.Line,
          nature: elem.Nature,
          numberSecuritiesAttached: elem.NumberSecuritiesAttached,
          numberNotSecuritiesAttached: elem.NumberNotSecuritiesAttached,
          percentage: elem.Percentage,
        });
      });
      await createRelation(
        sql,
        guid,
        "cbso.party",
        currentCompany.guid,
        "bce.enterprise",
        "SHAREHOLDER_PARENT",
        "SHAREHOLDER_CHILD",
        JSON.stringify(additionalInfo)
      );
    }
  }
  for (let i = 0; i < shareholders.IndividualShareHolders.length; i++) {
    const element = shareholders.IndividualShareHolders[i];
    const currentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(element.Person))
      .digest("hex");
    const findParty =
      await sql.query`select * from cbso.party where hash = ${currentHash}`;
    let guid;

    if (findParty.recordset.length === 1) {
      guid = findParty.recordset[0].guid;
    } else {
      guid = uuidv4();
      const request = new sql.Request();
      request.input("guid", sql.UniqueIdentifier, guid);
      request.input("createdOn", sql.DateTime, new Date());
      request.input("updatedOn", sql.DateTime, new Date());
      request.input("hash", sql.VarChar(64), currentHash);
      request.input("type", sql.VarChar(50), "PHYSICAL");
      request.input(
        "additionalInfo",
        sql.VarChar(sql.MAX),
        JSON.stringify({
          person: {
            firstName: element.Person.FirstName,
            lastName: element.Person.LastName,
            profession: element.Profession,
          },
          address: {
            street: element.Person.Address.Street,
            number: element.Person.Address.Number,
            box: element.Person.Address.Box,
            city: element.Person.Address.City,
            otherPostalCode: element.Person.Address.OtherPostalCode,
            otherCity: element.Person.Address.OtherCity,
            country: element.Person.Address.Country,
            otherCountry: element.Person.Address.OtherCountry,
            addressType: element.Person.Address.AddressType,
            otherAddressType: element.Person.Address.OtherAddressType,
          },
        })
      );
      await request.query(
        `INSERT INTO cbso.party
            (guid, createdOn, updatedOn, hash, type, additionalInfo) VALUES
            (@guid, @createdOn, @updatedOn, @hash, @type, @additionalInfo)`
      );
    }
    const additionalInfo = { rightsHeld: [] };
    element.RightsHeld.forEach((elem) => {
      additionalInfo.rightsHeld.push({
        line: elem.Line,
        nature: elem.Nature,
        numberSecuritiesAttached: elem.NumberSecuritiesAttached,
        numberNotSecuritiesAttached: elem.NumberNotSecuritiesAttached,
        percentage: elem.Percentage,
      });
    });
    await createRelation(
      sql,
      guid,
      "cbso.party",
      currentCompany.guid,
      "bce.enterprise",
      "SHAREHOLDER_PARENT",
      "SHAREHOLDER_CHILD",
      JSON.stringify(additionalInfo)
    );
  }
}
module.exports = {
  postAdministrators,
};
