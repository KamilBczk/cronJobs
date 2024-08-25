const cron = require("node-cron");
require("dotenv").config();
const { splitJobs } = require("./processingJobs/splitJobs");
const { dailyExtract } = require("./dailyExtract/index");
const { getBelgiumTime } = require("./utils/time");
const { relations } = require("./processingJobs/relations");
const { getSql } = require("./utils/databaseConnection");
const { syncEnterprise } = require("./sync");

//cron.schedule("*/10 * * * * *", async () => {
//console.log("a");
//});

// cron.schedule("0 12 * * *", async () => {
//   const date = getBelgiumTime();
//   console.log(
//     date.getHours() +
//       ":" +
//       date.getMinutes() +
//       ":" +
//       date.getMilliseconds() +
//       "\tExecuting dailyExtract()"
//   );
//   try {
//     await dailyExtract();
//   } catch (e) {
//     console.log(e);
//   }
// });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  while (true) {
    try {
      await syncEnterprise();
    } catch (e) {
      console.log(e);
    }
    //await delay(5000); // Attendre 10 secondes avant de relancer la tâche
  }
})();

