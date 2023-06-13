const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const dotenv = require('dotenv');
dotenv.config();

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.compose'
];

const TOKEN_PATH = 'token.json';

const credentials = {
  client_id: process.env.clientid,
  client_secret: process.env.secret,
  auth_uri:process.env.auth,
token_uri:process.env.token,
auth_provider_x509_cert_url:process.env.pro,
  redirect_uris: [process.env.uri]
};

const oAuth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

async function authorize() {
  try {
    const token = await readFileAsync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (error) {
    await getNewToken();
  }
}

function getNewToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code from the URL:', async (code) => {
      rl.close();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        await writeFileAsync(TOKEN_PATH, JSON.stringify(tokens));

        console.log('Token stored successfully.');

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function listUnreadEmails() {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread'
    });

    const messages = res.data.messages;

    if (messages.length === 0) {
      console.log('No new emails');
      return;
    }

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      });

      const threadId = email.data.threadId;
      const headers = email.data.payload.headers;
      const fromHeader = headers.find((header) => header.name === 'From');
      const replyHeaders = headers.filter((header) => header.name === 'In-Reply-To');

      if (replyHeaders.length === 0) {
        // No prior replies, send auto-reply
        const toAddress = fromHeader.value;
        const replySubject = 'Re: ' + email.data.payload.subject;
        const replyContent = 'Thank you for your email. I am currently on vacation and will respond to your message when I return.';
        await sendReply(toAddress, replySubject, replyContent);
      }

      await labelEmail(threadId);
    }
  } catch (error) {
    console.error('Error listing emails:', error);
  }
}


// Function to send email notification
async function sendReply(toAddress, replySubject, replyContent) {
  try {
    // Create a transporter with your email service provider configuration
    const transporter = nodemailer.createTransport({
      // Provide the SMTP server details and authentication credentials
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    // Compose the email options
    const mailOptions = {
      from: process.env.user,
      to: toAddress,
      subject: replySubject,
      text: replyContent,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



async function labelEmail(threadId) {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  try {
    const labels = await gmail.users.labels.list({
      userId: 'me'
    });

    const label = labels.data.labels.find((l) => l.name === 'Vacation Auto-Replies');

    if (!label) {
      await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: 'Vacation Auto-Replies',
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
      console.log('Label created');
    }

    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: [label.id],
        removeLabelIds: []
      }
    });

    console.log('Email labeled');
  } catch (error) {
    console.error('Error labeling email:', error);
  }
}

async function main() {
  try {
    while (true) {
      await authorize();
      await listUnreadEmails();

      // Generate a random interval between 45 to 120 seconds
      const interval = Math.floor(Math.random() * (120 - 45 + 1) + 45);
      console.log(`Waiting for ${interval} seconds before the next iteration...`);

      // Pause execution for the specified interval
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


main();
