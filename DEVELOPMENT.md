## Setup

#### Prerequisites

- Create a Firebase project
- Enable Google Authentication method
- Copy `.env.local.example` to `.env.local`

#### Admin

- In Firebase generate a private key under `Project settings` > `Service accounts`.
- Rename the resulting file to `serviceAccount.json`, and place it in the project root (gitignored).

#### FirebaseApp

- In Firebase under `Project settings` > `General` create a web application if you haven't done so already.
- Copy the `Config` version of the `Firebase SDK snippet` and paste it in `core/config.ts` under the `firebase` key.

#### Database

- Enable Firestore in your Firebase project
- Adjust the database url to reflect your project/database id

## Deploy

Automated by Vercel-GitHub integration (with default settings)

Try it yourself:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/webbertakken/simple-react-app)

## Customise

#### Icons part 1

- Generate the required formats at [https://www.favicon-generator.org/](https://www.favicon-generator.org/)
- Copy everything **except** `browserconfig.xml` and `manifest.json` to `images/icons` and overwrite all files.

#### Icons part 2

- Generate a manifest file and more icons at [https://manifest-gen.netlify.app/](https://manifest-gen.netlify.app/)
- Place the resulting `manifest.json` and `images` folder in `/public` (overwrite existing folders and files)

#### Meta information

- Change the variables in `core/config.ts`
