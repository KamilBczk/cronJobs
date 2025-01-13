const { MongoClient } = require("mongodb");

let client = null;

async function connectToMongoDB() {
  if (client) return client;

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("Connecté à MongoDB avec succès");
    return client;
  } catch (error) {
    console.error("Erreur de connexion à MongoDB:", error);
    throw error;
  }
}

function getDB() {
  if (!client) {
    throw new Error("La connexion MongoDB n'est pas établie");
  }
  return client.db(process.env.MONGODB_DATABASE_NAME);
}

module.exports = {
  connectToMongoDB,
  getDB,
};
