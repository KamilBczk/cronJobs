const { getBelgiumTime } = require("./time");
const { v4: uuidv4 } = require("uuid");

// TODO: NOT FINISHED
async function checkRelations(sql, id1, id2, forwardName) {
  sql.query`select * from cbso.relations where id1 = ${id1} AND id2 = ${id2} and forward`;
}

async function deleteRelations(sql, id2, forwardName) {
  sql.query`delete from cbso.relations where id2 = ${id2} AND forwardName = ${forwardName}`;
}

async function createRelation(
  sql,
  id1,
  type1,
  id2,
  type2,
  forwardName,
  backwardName,
  aditionnalInfo = null
) {
  const request = new sql.Request();
  request.input("guid", sql.UniqueIdentifier, uuidv4());
  request.input("createdOn", sql.DateTime, getBelgiumTime());
  request.input("updatedOn", sql.DateTime, getBelgiumTime());
  request.input("id1", sql.UniqueIdentifier, id1);
  request.input("type1", sql.VarChar(50), type1);
  request.input("id2", sql.UniqueIdentifier, id2);
  request.input("type2", sql.VarChar(50), type2);
  request.input("forwardName", sql.VarChar(50), forwardName);
  request.input("backwardName", sql.VarChar(50), backwardName);
  request.input("additionalInfo", sql.VarChar(sql.MAX), aditionnalInfo);

  await request.query(
    `INSERT INTO cbso.relations
        (guid, createdOn, updatedOn, id1, type1, id2, type2, forwardName, backwardName, additionalInfo) VALUES
        (@guid, @createdOn, @updatedOn, @id1, @type1, @id2, @type2, @forwardName, @backwardName, @additionalInfo)`
  );
}

module.exports = {
  deleteRelations,
  createRelation,
};
