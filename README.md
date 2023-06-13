# Gmail Auto-Reply

The Gmail Auto-Reply application is a Node.js script that automatically sends vacation auto-replies to unread emails in Gmail using the Gmail API.

## Prerequisites

Before running this application, make sure you have the following:

- Node.js installed on your machine
- A Gmail account
- Google API credentials (client ID and client secret) with access to the Gmail API. You can obtain these credentials by creating a new project on the [Google Cloud Console](https://console.cloud.google.com) and enabling the Gmail API.

## Getting Started

### Installation

1. Clone the repository or download the source code.

2. Install the dependencies by running the following command in your terminal:

   ```shell
   npm install

3. Configuration
Rename the .env.example file to .env.

Update the .env file with your Gmail account details and Google API credentials.

plaintext
Copy code
user=YOUR_EMAIL
pass=YOUR_PASSWORD
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET

4. Usage
Run the application by executing the following command:

shell
Copy code
node index.js
The application will prompt you to authorize it by visiting a URL. Open the URL in your browser and follow the instructions to authorize the application with your Gmail account. After authorizing, you will receive an authorization code.

Copy the authorization code and paste it into the terminal when prompted.

The application will start listing unread emails in your Gmail account, send auto-replies to new emails, and label the emails as "Vacation Auto-Replies".

The app will repeat this sequence of steps 1-4 in random intervals of 45 to 120 seconds.