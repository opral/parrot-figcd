#!/usr/bin/env node


// index.js
const { Command, Option } = require("commander");
const { authenticate } = require('../src/auth-helper');
const { getPluginInfo, prepareRelease, uploadCodeBundle, publishRelease } = require("../src/figma-helper");
const { updatePackageVersion } = require("../src/package-json-helper");

const authnTokenOption = (new Option('-t, --authn-token <string>', 'Figma AuthN Token'))
.makeOptionMandatory(true)
.env('FIGMA_WEB_AUTHN_TOKEN');

const manifestFileOption = (new Option('-m, --manifest-file <string>', 'Filepath to your plugins manifest.json')).default('./manifest.json')

async function main() {
    const program = new Command();
    // creating tool
    program
        .name("parrot-cd")
        .description("A CLI tool for continues delivery of Figma Plugins")
        .version("1.0.0");

    program
        .command("fig-auth")
        .description("Authenticate in Figma to get the AuthN Token needed to publish using Figmas web api")
        .action(authenticate)
        
    program
        .command("current-version")
        .description("Get the current Version of the plugin")
        .addOption(authnTokenOption)
        .addOption(manifestFileOption)
        .action(async ({authnToken, manifestFile}) => { 
            const currentPluginInfo = await getPluginInfo(manifestFile, authnToken); 
            
            console.log('Current Plugin Version' + currentPluginInfo.currentVersionNumber);
        })

    program
        .command("prepare")
        .description("Sets the package.json files minor part of the version to the next version of the figma plugin. Expects a valid authN token from figma set to the FIGMA_WEB_AUTHN ENV variable!")
        .option('-p, --package-file <string>', 'Filepath to your package.json', 'package.json')
        .addOption(authnTokenOption)
        .addOption(manifestFileOption)
        .action(async ({manifestFile, packageFile, authnToken}) => { 
            const currentVersionNumber = (await getPluginInfo(manifestFile, authnToken)).currentVersionNumber; 
            updatePackageVersion(packageFile, currentVersionNumber + 1)
            console.log('Minor Version in '+ packageFile + ' updated to '+ (currentVersionNumber+1))
        })

    program
     .command("create-api-key")
     .description("Create a Figma api key")
     .addOption(authnTokenOption)
     .option('-e, --expiriation <number>', 'Exporiration in seconds (default: 240 Seconds)', 240)
     .option('-d, --description <number>', 'Description of the token', 'parrot-cd-generated-token')
     .option('-s, --scopes <scopes...>', 'Scopes for the token', ['files:read'])
     .action(async ({authnToken, expiriation, description, scopes}) => { 
        const apiToken = getFigmaApiToken(authnToken, description, expiriation, scopes)
        console.log(apiToken);
     })

    program
     .command("release")
     .description("Release a new version - expects the build to been done in an earlier step")
     .addOption(authnTokenOption)
     .addOption(manifestFileOption)
     .option('-n, --store-name <string>', 'Name of the plugin apearing on the store - falling back to the current one in the store if not specified')
     .option('-d, --store-description <string>', 'Description of the figma plugin')
     .option('-df, --store-description-file <string>', 'Path to a file containing the Description of the figma plugin')
     .option('-tl, --tagline <string>', 'Tagline - falling back to the current one in the store if not specified')
     .option('-t, --tags <string>...', 'Tags - falling back to the current ones in the store if not specified')
     .option('-c, --enable-comments <boolean>', 'Enable Comments - falling back to the current ones in the store if not specified')
     .option('-rn, --release-notes <string>', 'Release Notes', '')
     .option('-rnf, --release-notes-file <string>', 'Release Notes file containing the description of what has changed - {{VERSION}} will be replaced with version figma of the plugin')
     .action(async ({authnToken, manifestFile, storeName, storeDescription, storeDescriptionFile, tagline, tags, releaseNotes, releaseNotesFile}) => { 
        
        const currentPluginInfo = await getPluginInfo(manifestFile, authnToken)
        if (storeDescriptionFile !== undefined && storeDescriptionFile !== '') {
            storeDescription = fs.readFileSync(storeDescriptionFile, 'utf8');
        } if (storeDescription === undefined) {
            storeDescription = currentPluginInfo.currentVersion.description;
        }

        if (releaseNotesFile !== undefined && releaseNotesFile !== '') {
            if (releaseNotesFile.indexOf('{{VERSION}}')) {
                releaseNotesFile = releaseNotesFile.replace('{{VERSION}}', currentPluginInfo.currentVersionNumber + 1);
            }
            releaseNotes = fs.readFileSync(releaseNotesFile, 'utf8');
        } else

        if (storeName === undefined) {
            storeName = currentPluginInfo.currentVersion.name;
            console.log('--store-name not provided using current store name', )
        }

        if (tagline === undefined) {
            tagline = currentPluginInfo.currentVersion.tagline;
        }

        if (tags === undefined) {
            tags = currentPluginInfo.tags;
        }
        
        console.log('Preparing release....');
        const preparedRelease = await prepareRelease(manifestFile, storeName, storeDescription, tagline, tags, authnToken);
        console.log('...Release Prepared');
        const preparedVersionId = preparedRelease.version_id;
        const signature = preparedRelease.signature;


        console.log('Creating and uploading code bundle....');
        const codeUpload = await uploadCodeBundle(manifestFile, preparedRelease.code_upload_url);
        console.log('...Creation and Upload done');

        console.log('Releasing prepared Publishing version (' + preparedRelease.version_id + ')...');
        const publishedVersion = await publishRelease(manifestFile, preparedVersionId, signature, authNToken);
        console.log('Version '+ publishedVersion.plugin.versions[preparedVersionId].version +' (' + preparedVersionId + ') published');

        })

        await program.parseAsync();
}

main();