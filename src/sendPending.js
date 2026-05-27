const { processPendingNotifications } = require('./notifications');

processPendingNotifications()
  .then(results => {
    console.log(JSON.stringify({ ok: true, results }, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
