function getBelgiumTime() {
  const now = new Date();
  const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const isDST =
    now.getTimezoneOffset() <
    Math.max(
      new Date(now.getFullYear(), 0, 1).getTimezoneOffset(),
      new Date(now.getFullYear(), 6, 1).getTimezoneOffset()
    );
  const belgiumOffset = isDST ? 2 : 1; // UTC+2 en été, UTC+1 en hiver
  const belgiumTime = new Date(utcTime.getTime() + belgiumOffset * 3600000);
  return belgiumTime;
}

module.exports = {
  getBelgiumTime,
};
