# Spotify Accounts Stats Mining Web App

This project is meant for crowdsourcing music engagement data from multiple music streaming platforms. It was built on top of the the Web Auth example from the Spotify API documentaion, which can be found [here](https://developer.spotify.com/web-api/authorization-guide/).

## Installation

### A) Create an application on Spotify API
Create an application on the [Spotify API dashboard](https://developer.spotify.com/dashboard/applications), then copy the credentials (**client_id**, **client_secret**), and provide the **redirect URI** for the web application to host this service.

### B) Environment Configuration

create a **.env** file in the root of the project folder for server configuration, using the following template:
 
```
SPOTIFY_CLIENT_ID=<your_spotify_client_id_here>
SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret_here>
SPOTIFY_REDIRECT_URI=<your_spotify_redirect_uri>
```

### C) Install dependencies 

run **npm install** in the project's root folder from the terminal to install the project's dependencies.

### D) Running the web app
To run this project on your local machine, make sure the **SPOTIFY_REDIRECT_URI** variable in the **.env** is using "**http://localhost:8888/callback**". You can chose whichever port number you like.

now enter the following command in your terminal:
```
npm start
```

If you'd like to make changes to the code while the server is still running, run the server in this manner:
```
nodemon start
```

Go to your browser and type **http://localhost:8888**, then click the "Login with Spotify" button to start the mining process.

### E) Accessing the datasets mined from web app
To get a zipped copy of the datasets accumulated by the app, type **http://localhost:8888/general/datasets**. This will start the download on your browser, and you can unzip the file with a utility like Keka or WinRar.