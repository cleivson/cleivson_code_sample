## Description

Toptal screening project consisting of a REST API for keeping track of jogging times of users.

## Installation (Linux/Mac OS)

- Make sure you have [NVM](https://github.com/nvm-sh/nvm) installed.
- Make sure and that you are using node's lts/erbium version
```bash
$ nvm install node lts/erbium
```
- Clone this repository and install the dependencies using npm.

```bash
$ git clone https://git.toptal.com/Ivan-Ilijasic/cleivson-siqueira-de-arruda.git
$ cd cleivson-siqueira-de-arruda
$ npm install
```

## Installation (Windows)

Not yet supported because of [bcrypt](https://www.npmjs.com/package/bcrypt) dependency. We plan to change this dependency in future.

## Running the app

In order to run the app, you need no create a database (only tested with MySql until now) and put its configurations in the file ormconfig.json.

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

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
