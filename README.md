# 🧰 Superset Bulk Users

> This is a MVP script for loading bulk users to Superset via the [API](https://superset.apache.org/docs/api/). It expects a csv file, see /src/template.csv for a sample.

#### How it works
1. It uses the permissions of the default dashboard viewer role to create custom roles from the csv
2. It creates users and assigns them roles (1:1 mapping). The tables to be accessed are defined in the .env file
3. It create row-level-security entries to ensure role based access to the dashboards

#### How to use it
1. Populate your csv file, refer to the `./src/template.csv` for a sample
2. Define your environment variables - make a copy of `.env.template` and rename to `.env`
3. Install dependencies: run `npm i`
4. Build: run `npm run build`
5. Start: run `npm run start`

### Scripts

#### `npm run start:dev`

Starts the app in dev mode using `nodemon` and `ts-node` for hot reloading.

#### `npm run start`

Starts the app in prod mode, first building the app with `npm run build`, and then runs the compiled JavaScript at `build/index.js`.

#### `npm run build`

Builds the app to `/build`.

#### `npm run test`

Runs the `jest` tests once.

#### `npm run test:dev`

Run the `jest` tests in watch mode.

#### `npm run prettier-format`

Formats your code.

#### `npm run prettier-watch`

Formats your code in watch mode.

### Notes
- This script is in active development. Errors are expected.
