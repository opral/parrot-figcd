# FIGCD - A CLI Tool for Continuous Delivery of Figma Plugins

[![Version](https://img.shields.io/npm/v/figcd.svg)](https://www.npmjs.com/package/figcd)
[![License](https://img.shields.io/npm/l/figcd.svg)](https://github.com/parrots-design/figcd/blob/main/LICENSE)

This CLI tool is inspired by the insightful talk of [Jean-François Bisson at config 2023](https://www.youtube.com/watch?v=s9fwTc0fRs0&ab_channel=Figma) and the incredible work of Fastlane (the counterpart for iOS and Android apps).

During the development of [Parrot](https://www.figma.com/community/plugin/1205803482754362456/Parrot-Beta) – a Figma Plugin that simplifies translation within Figma – I faced the challenge of setting up a reliable Continuous Delivery process and the manual process of publishing within the Figma app.

This figcd CLI aims to ease those frustrations, allowing you to effortlessly integrate the latest source state into Figma, streamline the manual publishing process, and seamlessly incorporate it into a state-of-the-art CI/CD setup. With figcd, you can focus on your creative work while ensuring your Figma plugins reach users smoothly and efficiently.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Running with npx](#running-with-npx)
  - [Running in Github](#running-within-a-github-action) 
  - [figcd cli](#figcd---cli)
    - [Authentication - auth](#authentication)
    - [Get Current Version - current-version](#get-current-version)
    - [Prepare Plugin Version - prepare](#prepare-plugin-version)
    - [Create API Key - create-api-key](#create-api-key)
    - [Release New Version - release](#release-new-version)
- [Options](#options)
- [License](#license)

## Installation

To get started with the figcd CLI, you need to have [Node.js](https://nodejs.org) installed. Then, install the package globally using npm:

```
npm install -g figcd
```

## Usage

### Running with npx

If you don't have the CLI installed globally or want to use the latest version without installing it, you can use `npx` to run the CLI directly:

```
npx figcd <command> [options]
```

For example:

```
npx figcd auth
```

### Running within a GitHub Action

To use figcd within a GitHub Action, follow these steps to set up the necessary authentication token:

1. Obtain a fresh authentication token by running the following command on your local machine:
```
npx figcd auth
```
This command will prompt you to log in using 2-factor authentication and generate a new Figma API token.

2. Add the created token as a GitHub Action secret. Go to your GitHub repository, click on "Settings" > "Secrets" and then click "New repository secret". Name the secret `FIGMA_WEB_AUTHN_TOKEN` and paste the token value into the "Value" field. Click "Add secret" to save it.

3. In your GitHub Action workflow file (e.g., `.github/workflows/publish.yml`), make the token available as an environment variable using the `env` keyword:
```
jobs:
    my_job:
    runs-on: ubuntu-latest

    env:
        FIGMA_WEB_AUTHN_TOKEN: ${{ secrets.FIGMA_WEB_AUTHN_TOKEN }}

    steps:
        # Add your other steps here
```
   
With these steps completed, figcd will be able to use the authentication token during the GitHub Action run.

#### Sample Workflow File

For a complete example of how to use figcd in a GitHub Action, check out our [sample workflow file](examples/publish.yml) located in the `examples` directory.

This workflow demonstrates the process of setting up figcd, authenticating with Figma, and automating the plugin publishing steps. You can use this as a starting point for integrating figcd into your own GitHub Actions.

Happy automating!


### figcd - cli

If you have the figcd package installed in your project's dependencies, you can run the CLI commands directly:

#### Authentication

Authenticate in Figma to get the AuthN Token needed to publish using Figma's web API.

```
figcd fig-auth [options]
```

**Options:**

- `-h, --help`: Display help for the command.

#### Get Current Version

Get the current Version of the plugin.

```
figcd current-version [options]
```

**Options:**

- `-t, --authn-token <string>`: Figma AuthN Token (env: FIGMA_WEB_AUTHN_TOKEN)
- `-m, --manifest-file <string>`: Filepath to your plugin's manifest.json (default: "./manifest.json")
- `-h, --help`: Display help for the command.

#### Prepare Plugin Version

Sets the package.json files minor part of the version to the next version of the Figma plugin. Expects a valid AuthN Token from Figma set to the `FIGMA_WEB_AUTHN_TOKEN` environment variable.

```
figcd prepare [options]
```

**Options:**

- `-p, --package-file <string>`: Filepath to your package.json (default: "package.json")
- `-t, --authn-token <string>`: Figma AuthN Token (env: FIGMA_WEB_AUTHN_TOKEN)
- `-m, --manifest-file <string>`: Filepath to your plugin's manifest.json (default: "./manifest.json")
- `-h, --help`: Display help for the command.

#### Create API Key

Create a Figma API key.

```
figcd create-api-key [options]
```

**Options:**

- `-t, --authn-token <string>`: Figma AuthN Token (env: FIGMA_WEB_AUTHN_TOKEN)
- `-e, --expiration <number>`: Expiration in seconds (default: 240 Seconds) (default: 240)
- `-d, --description <string>`: Description of the token (default: "figcd-generated-token")
- `-s, --scopes <scopes```>`: Scopes for the token (default: ["files:read"])
- `-h, --help`: Display help for the command.

#### Release New Version

Release a new version of your Figma plugin (expects the build to be done in an earlier step).

```
figcd release [options]
```

**Options:**

- `-t, --authn-token <string>`: Figma AuthN Token (env: FIGMA_WEB_AUTHN_TOKEN)
- `-m, --manifest-file <string>`: Filepath to your plugin's manifest.json (default: "./manifest.json")
- `-n, --store-name <string>`: Name of the plugin appearing on the store - falling back to the current one in the store if not specified
- `-d, --store-description <string>`: Description of the Figma plugin
- `-df, --store-description-file <string>`: Path to a file containing the description of the Figma plugin
- `-tl, --tagline <string>`: Tagline - falling back to the current one in the store if not specified
- `-t, --tags <string>````: Tags - falling back to the current ones in the store if not specified
- `-c, --enable-comments <boolean>`: Enable Comments - falling back to the current ones in the store if not specified
- `-rn, --release-notes <string>`: Release Notes (default: "")
- `-rnf, --release-notes-file <string>`: Release Notes file containing the description of what has changed - {{VERSION}} will be replaced with the version of the Figma plugin
- `-h, --help`: Display help for the command.

## Options

- `-V, --version`: Output the version number of the CLI.
- `-h, --help`: Display help for the command.


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Disclaimer:**
This project does in no way affiliated with Figma Inc. This project is open source under the MIT license, which means you have full access to the source code and can modify it to fit your own needs. figcd runs on your own computer or server, so your credentials or other sensitive information will never leave your own computer. You are responsible for how you use figcd.

---

This README provides an overview of the figcd CLI's capabilities and how to use its various commands and options. Feel free to customize it further based on your package's specific features and requirements. Happy coding!
