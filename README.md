# Blockchain explained by Example

## Purpose
This project demonstrates the basic functions of a blockchain by example. A running installation is provided under: 
https://adisoftware-blockchain.firebaseapp.com

## Usage
Usage of the app is explained on: https://www.adisoftware.ch/2019/11/07/blockchain-who-are-you

## Preparation
I assume, you have an AngularNG development environment up and running.

Then:
- Install ionic cli: `npm install -g ionic`
- Install firebase cli: `npm install -g firebase-tools`

## Building the project
As it's an AngularNG/ionic project, you can build it by:
- download or fork the repo
- run `ionic install`

## Running the project
For running the project, you need a firebase project:
- create a free account on https://firebase.google.com
- create a new project, including `Cloud Firestore` database and `hosting` (if you like)
- add a web app
- transfer your firebase config from the web apps configuration tab to your `environment.ts` / `environment.prod.ts`
- create exactly one object `messages` with ID `1` in your Cloud Firestore database. Attributes: `event`: `string` / `message`: `string`

### Running locally (dev)
- Run `firebase login` to log in to your firebase account
- Run `firebase add` to bind your firebase project
- Run `ionic serve --open` for running the project locally

### Running on firebase hosting
I assume you already executed the steps for running the project locally.

Then:
- Build the project: `ionic build --prod`
- Deploy to firebase: `firebase deploy`
