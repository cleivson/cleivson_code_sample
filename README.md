## Description

Project consisting of a REST API for keeping track of jogging times of users.

## Installation (Linux/Mac OS)

- Make sure you have [NVM](https://github.com/nvm-sh/nvm) installed.
- Make sure and that you are using node's lts/erbium version
```bash
$ nvm install node lts/erbium
```
- Clone this repository and install the dependencies using npm.

```bash
$ git clone git@github.com:cleivson/cleivson_code_sample.git
$ cd cleivson_code_sample
$ npm install
```

## Installation (Windows)

Not yet supported because of [bcrypt](https://www.npmjs.com/package/bcrypt) dependency. We plan to change this dependency in the future.

## Running the app

### Prerequisites

In order to run the app, you need to create a database (only tested with MySql until now) and put its configurations in the file ormconfig.json.
You can use the sample `docker-compose.yaml` file to run a simple configuration (not production ready) of the database for testing.

Also, you have to setup the API Key from [SendGrid](https://sendgrid.com/). To do this, follow the steps in: https://app.sendgrid.com/guide/integrate/langs/nodejs. Make sure you have your API Key under SENDGRID_API_KEY in the .env.{environment} file or as an environment variable.

To check the weather conditions of the jogging activities, you need to create an account in the [WorldWeatherOnline](https://www.worldweatheronline.com/developer) (Free 60-day trial) and set the API Key under WEATHER_API_KEY in the .env.{environment} file or as an environment variable.

### Running

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Seed data

To make it easier to test the app, there's a seed service that helps pre populate some users. This service is also used by integration tests to create the expected scenarios for the tests.

To run the seeder service, type:
`npm run seed`

## Test

```bash
# unit tests
$ npm run test

# e2e tests
# For e2e tests you have to create a database and put its configurations in the file ormconfig.json with the name "test"
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API Documentation

When you run the app, the API documentation will be available through a Swagger page in the path ```/api```.

Example: `localhost:3000/api`

## Additional tasks

### Editing the Query Filter Syntax

First you need to install locally the [nearley](https://nearley.js.org/docs/getting-started) compiler:

```npm install -g nearley```

After that you can edit the grammar source file under `src/query/parser/grammar.ne` and compile it using the command:

```nearleyc grammar.ne -o grammar.ts```

#### Testing your query sintax
For now nearly-test **does not support TypeScript**, so remove the `@preprocessor typescript` (if it's there) line 
at the beginning of the grammar file and recompile your grammar using ```nearlyc grammar.ne -o grammar.js```.

To test your changes you can use the `nearley-test` command:

```nearleyc grammar.js -i "{YOUR TEST INPUT}"```
