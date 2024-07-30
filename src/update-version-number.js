const { getFigmaCookie, getCurrentFigmaPluginVersion } = require('./figma-helper.js');
const { updatePackageVersion } = require('./package-helper.js');
require('dotenv').config();
const authNToken = process.env.FIGMA_WEB_AUTHN;
const manifestFilePath = './manifest.json';
const packageFilePath = './package.json';
const { cookie } = await getFigmaCookie();

if (!authNToken) {
    throw new Error('Env variable FIGMA_WEB_AUTHN not set')
}

async function runCLI() {
    // Launch a headless browser
    // const apiToken = await getFigmaApiToken(authNToken);

    const currentVersion = await getCurrentFigmaPluginVersion(manifestFilePath, authNToken, cookie);
    
    console.log(currentVersion);

    updatePackageVersion(packageFilePath, currentVersion + 1);
}

runCLI();