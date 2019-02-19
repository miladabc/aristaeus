const sendgrid = require('sendgrid');
const { mail: helper } = sendgrid;

const keys = require('../config/keys');

class Mailer extends helper.Mail {
  constructor({ from, subject, recipients, content }) {
    super();

    this.sgApi = sendgrid(keys.sendgridAPIKey);
    this.from_email = new helper.Email(from);
    this.subject = subject;
    this.body = new helper.Content('text/html', content);
    this.recipients = this.formatAddresses(recipients);

    this.addContent(this.body);
    this.addClickTracking();
    this.addRecipients();
  }

  formatAddresses(recipients) {
    return recipients.map(recipient => new helper.Email(recipient));
  }

  addClickTracking() {
    const trackingSettings = new helper.TrackingSettings();
    const clickTracking = new helper.ClickTracking(true, true);

    trackingSettings.setClickTracking(clickTracking);
    this.addTrackingSettings(trackingSettings);
  }

  addRecipients() {
    const personalize = new helper.Personalization();
    this.recipients.forEach(recipient => {
      personalize.addTo(recipient);
    });
    this.addPersonalization(personalize);
  }

  send() {
    const request = this.sgApi.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: this.toJSON()
    });

    this.sgApi.API(request);
  }
}

module.exports = Mailer;
