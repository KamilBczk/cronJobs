const cron = require("node-cron");
require("dotenv").config();
const { splitJobs } = require("./processingJobs/splitJobs");
const { dailyExtract } = require("./dailyExtract/index");
const { getBelgiumTime } = require("./utils/time");
const { relations } = require("./processingJobs/relations");
const { getSql } = require("./utils/databaseConnection");
const { syncEnterprise } = require("./sync");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debug = true;

(async () => {
  while (true) {
    try {
      await syncEnterprise(debug);
      if (debug === true)
        break;
    } catch (e) {
      console.log(e);
    }
    //await delay(5000); // Attendre 10 secondes avant de relancer la tâche
  }
})();

