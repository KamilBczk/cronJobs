const cron = require("node-cron");
require("dotenv").config();
const { splitJobs } = require("./processingJobs/splitJobs");
const { dailyExtract } = require("./dailyExtract/index");

cron.schedule("* * * * *", async () => {
  console.log("Executing splitJobs()");
  try {
    await splitJobs();
  } catch (e) {
    console.log(e);
  }
});

cron.schedule("0 12 * * *", async () => {
  console.log("Executing dailyExtract()");
  try {
    await dailyExtract();
  } catch (e) {
    console.log(e);
  }
});
