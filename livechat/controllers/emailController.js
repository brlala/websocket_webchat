let Mailgun = require('mailgun-js');
const { getBotConfig } = require('../globals');

// Your domain, from the Mailgun Control Panel
const DOMAIN = 'mg.pand.ai';

async function sendEmail(to, subject, html) {
  // Your sending email address
  const from = 'Automated Email <noreply@mg.pand.ai>';

  let data = {
    from,
    to,
    subject,
    html,
  };
  const botConfig = await getBotConfig();
  let apiKey = botConfig.chatbot.MAILGUN_KEY;
  let mailgun = new Mailgun({ apiKey, domain: DOMAIN });

  // Invokes the method to send emails given the above data with the helper library
  mailgun.messages().send(data, (err, body) => {
    // If there is an error, render the error page
    if (err) {
      console.log('got an error: ', err);
    } else {
      console.log(data);
    }
  });
}

module.exports.sendEmail = sendEmail;
