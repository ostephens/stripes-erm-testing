import { setInteractorTimeout } from '@interactors/globals';

// adding of methods do and expect
import '@interactors/with-cypress';
import 'cypress-file-upload';
import 'cypress-wait-until';

setInteractorTimeout(100_000);

// Direct paths are icky but stripes-testing was never meant to be a library
// Possibly better to copy logic if this fails
require('@folio/stripes-testing/cypress/support/tenant');

require('./api'); // I have NO idea why but these need to be require not import
require('./stripes');
require('./users');
require('./login');
require('./cypressUtilityFunctions');

require('cypress-downloadfile/lib/downloadFileCommand');
require('cypress-xpath');
require('cypress-grep')();

// try to fix the issue with cached location in cypress
Cypress.on('window:before:load', window => {
  Object.defineProperty(window.navigator, 'language', { value: 'en' });
});

const defaultTestLanguage = 'en-US';
const defaultTestTimezone = 'UTC';
let localeSettingsId;
let localeSettingsValue;
before(() => {
  // This is running before all tests, make sure logged in as admin
  cy.getAdminToken();
  cy.getLocaleSettings().then(body => {
    if (Object.keys(body).length > 0) {
      localeSettingsId = body.id;
      localeSettingsValue = body.value;
      const localeValue = localeSettingsValue.match(/"locale":"(.*?)"/);
      const timezoneValue = localeSettingsValue.match(/"timezone":"(.*?)"/);
      const extractedLocale = localeValue ? localeValue[1] : undefined;
      const extractedTimezone = timezoneValue ? timezoneValue[1] : undefined;

      Cypress.env('localeValue', extractedLocale);
      Cypress.env('timezoneValue', extractedTimezone);

      if (extractedLocale !== defaultTestLanguage || extractedTimezone !== defaultTestTimezone) {
        const updatedValue = localeSettingsValue.replace(/"locale":"[^"]*"/, `"locale":"${defaultTestLanguage}"`).replace(/"timezone":"[^"]*"/, `"timezone":"${defaultTestTimezone}"`);
        cy.putLocaleSettings(localeSettingsId, updatedValue);
      }
    }
  });
});

after(() => {
  if ((Cypress.env('localeValue') && Cypress.env('localeValue') !== defaultTestLanguage) ||
    (Cypress.env('timezoneValue') && Cypress.env('timezoneValue') !== defaultTestTimezone)) {
    // This is running after all tests, make sure logged in as admin (test should have logged user out)
    cy.getAdminToken();
    cy.putLocaleSettings(localeSettingsId, localeSettingsValue);
  }
});
