# big boring system

## Setup

After cloning the repo, install dependencies and copy the local configuration file:

    npm install
    cp local.json-dist local.json

Create a Twilio account. After you create it, go to https://www.twilio.com/user/account/ to get the SID and Auth Token. Enter these into local.json

Make sure that `twilioNumber` in local.json has an area code.

Then start the server:

    npm start

Visit http://localhost:3000 in your browser.

## Authenticating

When testing locally, you don't really need to authenticate to your real phone number. You can add something invalid just as long as it is 10 digits like `1111111111`. If you watch the server logs in your terminal, you will see a PIN scroll by that will show up before the Twilio error about an invalid number displays. Just enter that to create a valid session.
