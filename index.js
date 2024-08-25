const cron = require("node-cron");
require("dotenv").config();
const { splitJobs } = require("./processingJobs/splitJobs");
const { dailyExtract } = require("./dailyExtract/index");
const { getBelgiumTime } = require("./utils/time");
const { relations } = require("./processingJobs/relations");
const { getSql } = require("./utils/databaseConnection");
const { syncEnterprise } = require("./sync");

// cron.schedule("* * * * *", async () => {
//   const date = getBelgiumTime();
//   console.log(
//     date.getHours() +
//       ":" +
//       date.getMinutes() +
//       ":" +
//       date.getMilliseconds() +
//       "\tExecuting splitJobs()"
//   );
//   try {
//     await splitJobs();
//   } catch (e) {
//     console.log(e);
//   }
// });

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

(async () => {
  try {
    await syncEnterprise();
  } catch (e) {
    console.log(e);
  }
})();
