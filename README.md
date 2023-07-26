# FIGCD - A CLI Tool for Continuous Delivery of Figma Plugins

[![Version](https://img.shields.io/npm/v/@parrots.design/figcd.svg)](https://www.npmjs.com/package/@parrots.design/figcd)
[![License](https://img.shields.io/npm/l/@parrots.design/figcd.svg)](https://github.com/yourusername/figcd/blob/main/LICENSE)

This CLI tool is inspired by the insightful talk of [Jean-François Bisson at config 2023](https://www.youtube.com/watch?v=s9fwTc0fRs0&ab_channel=Figma) and the incredible work of Fastlane (the counterpart for iOS and Android apps).

During the development of [Parrot](https://www.figma.com/community/plugin/1205803482754362456/Parrot-Beta) – a Figma Plugin that simplifies translation within Figma – I faced the challenge of setting up a reliable Continuous Delivery process and the manual process of publishing within the Figma app.

This figcd CLI aims to ease those frustrations, allowing you to effortlessly integrate the latest source state into Figma, streamline the manual publishing process, and seamlessly incorporate it into a state-of-the-art CI/CD setup. With figcd, you can focus on your creative work while ensuring your Figma plugins reach users smoothly and efficiently.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Running with npx](#running-with-npx)
  - [Running in a Project](#running-in-a-project)
    - [Authentication](#authentication)
    - [Get Current Version](#get-current-version)
    - [Prepare Plugin Version](#prepare-plugin-version)
    - [Create API Key](#create-api-key)
    - [Release New Version](#release-new-version)
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

### Running in a Project

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
