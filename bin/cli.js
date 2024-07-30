#!/usr/bin/env node


// index.js
const fs = require('fs');
// const crypto = require('crypto');
// const path = require('path');
const { Command, Option } = require("commander");
const { authenticate } = require('../src/auth-helper');
const { getPluginInfo, prepareRelease, uploadCodeBundle, publishRelease, getCategories, getFigmaCookie, getFigmaApiToken } = require("../src/figma-helper");
const { updatePackageVersion } = require("../src/package-json-helper");

// Get SHA1 hash for cover image upload
// const getHash = (filePath) => new Promise((resolve, reject) => {
//     const hash = crypto.createHash('sha1');
//     const rs = fs.createReadStream(path.resolve(filePath));
//     rs.on('error', reject);
//     rs.on('data', chunk => hash.update(chunk));
//     rs.on('end', () => resolve(hash.digest('hex')));
// });

const parseMedia = (carouselMediaUrls, carouselVideoUrls) => {
    return {
        carouselMedia: Object.keys(carouselMediaUrls).length > 0
            ? Object.keys(carouselMediaUrls).map((index) => ({
                carousel_position: index,
                sha1: carouselMediaUrls[index].sha1,
            }))
            : undefined,
        carouselVideos: Object.keys(carouselVideoUrls).length > 0
            ? Object.keys(carouselVideoUrls).map((index) => ({
                carousel_position: index,
                sha1: carouselVideoUrls[index].sha1,
            }))
            : undefined,
    };
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(uuid);
}
function kebabToSnakeCase(str) {
    return str.replace(/-/g, '_');
}

const authnTokenOption = (new Option('-t, --authn-token <string>', 'Figma AuthN Token'))
.makeOptionMandatory(true)
.env('FIGMA_WEB_AUTHN_TOKEN');

const cookieOption = (new Option('-ck, --cookie <string>', 'Figma cookies for auth'))
.env('FIGMA_COOKIE');

const tsidOption = (new Option('-tsid, --tsid <string>', 'Figma session id'))
.env('FIGMA_TSID');

const manifestFileOption = (new Option('-m, --manifest-file <string>', 'Filepath to your plugins manifest.json')).default('./manifest.json')

async function main() {
    const program = new Command();
    // creating tool
    program
        .name("figcd")
        .description("A CLI tool for continues delivery of Figma Plugins")
        .version("1.0.0");

    program
        .command("auth")
        .description("Authenticate in Figma to get the AuthN Token needed to publish using Figmas web api")
        .addOption(cookieOption)
        .addOption(tsidOption)
        .action(authenticate)
        
    program
        .command("current-version")
        .description("Get the current Version of the plugin")
        .addOption(authnTokenOption)
        .addOption(cookieOption)
        .addOption(manifestFileOption)
        .action(async ({authnToken, cookie, manifestFile}) => { 
            const currentPluginInfo = await getPluginInfo(manifestFile, authnToken, cookie); 
            
            console.log('Current Plugin Version' + currentPluginInfo.currentVersionNumber);
        })
    
    program
        .command("get-cookies")
        .action(async () => {
            const { cookie, tsid } = await getFigmaCookie();
            console.log(`FIGMA_COOKIE='${cookie}' FIGMA_TSID=${tsid}`);
        })

    program
        .command("prepare")
        .description("Sets the package.json files minor part of the version to the next version of the figma plugin. Expects a valid authN token from figma set to the FIGMA_WEB_AUTHN ENV variable!")
        .option('-p, --package-file <string>', 'Filepath to your package.json', 'package.json')
        .addOption(authnTokenOption)
        .addOption(cookieOption)
        .addOption(manifestFileOption)
        .action(async ({manifestFile, cookie, packageFile, authnToken}) => { 
            const currentVersionNumber = (await getPluginInfo(manifestFile, authnToken, cookie)).currentVersionNumber; 
            updatePackageVersion(packageFile, currentVersionNumber + 1)
            console.log('Minor Version in '+ packageFile + ' updated to '+ (currentVersionNumber+1))
        })

    program
     .command("create-api-key")
     .description("Create a Figma api key")
     .addOption(cookieOption)
     .addOption(authnTokenOption)
     .option('-exp, --expiriation <number>', 'Exporiration in seconds (default: 240 Seconds)', 240) // Deprecated
     .option('-e, --expiration <number>', 'Expiration in seconds (default: 240 Seconds)', 240)
     .option('-d, --description <number>', 'Description of the token', 'parrot-cd-generated-token')
     .option('-s, --scopes <scopes...>', 'Scopes for the token', ['files:read'])
     .action(async ({authnToken, cookie, expiration, expiriation, description, scopes}) => { 
        const apiToken = await getFigmaApiToken(authnToken, cookie, description, expiration || expiriation, scopes)
        console.log(apiToken);
     })

    program
     .command("release")
     .description("Release a new version - expects the build to been done in an earlier step")
     .addOption(authnTokenOption)
     .addOption(cookieOption)
     .addOption(manifestFileOption)
     .option('-n, --store-name <string>', 'Name of the plugin apearing on the store - falling back to the current one in the store if not specified')
     .option('-d, --store-description <string>', 'Description of the figma plugin')
     .option('-df, --store-description-file <string>', 'Path to a file containing the Description of the figma plugin')
     .option('-tl, --tagline <string>', 'Tagline - falling back to the current one in the store if not specified')
     .option('-tg, --tags <string...>', 'Tags - falling back to the current ones in the store if not specified')
     .option('-c, --enable-comments <boolean>', 'Enable Comments - falling back to the current ones in the store if not specified')
     .option('-rn, --release-notes <string>', 'Release Notes', '')
     .option('-ctg, --category <string>', 'Category')
     .option('-rnf, --release-notes-file <string>', 'Release Notes file containing the description of what has changed - {{VERSION}} will be replaced with version figma of the plugin')
     .action(async ({authnToken, manifestFile, storeName, storeDescription, storeDescriptionFile, tagline, tags, releaseNotes, releaseNotesFile, category, cookie}) => { 
        
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
            console.log("Release Notes file argument found from file: " + releaseNotesFile);
            releaseNotes = fs.readFileSync(releaseNotesFile, 'utf8');
        } 

        if (storeName === undefined) {
            storeName = currentPluginInfo.currentVersion.name;
            console.log('--store-name not provided using current store name')
        }

        if (!category) {
            category = currentPluginInfo.category_id;
            console.log('--category not provided using current category id');
        } else if (!isValidUUID(category)) {
            const categories = await getCategories(authnToken);
            const foundCategory = categories.find(({ url_slug }) => (kebabToSnakeCase(url_slug) === kebabToSnakeCase(category)));
            if (foundCategory && foundCategory.id && foundCategory.parent_category_id) {
                console.log('--category is not a valid UUID, category ID fetched from URL slug');
                category = foundCategory.id;
            } else {
                console.warn('--category is not a valid UUID, could not find valid category');
            }
        }

        if (tagline === undefined) {
            tagline = currentPluginInfo.currentVersion.tagline;
        }

        if (tags === undefined) {
            tags = currentPluginInfo.tags;
        }
        const { carouselMedia, carouselVideos } = parseMedia(currentPluginInfo.carousel_media_urls, currentPluginInfo.carousel_videos);
        
        console.log('Preparing release....');
        console.log({ manifestFile, storeName, storeDescription, releaseNotes, category, tagline, tags });

        // // const carouselImages = ['dist/cover.png'];
        // const carouselImages = undefined;

        // const carouselImageShas = carouselImages ? await Promise.all(
        //     carouselImages?.map(async (p, i) => ({
        //         "carousel_position": i,
        //         "sha1": await getHash(p)
        //     }))
        // ) : undefined;
        // console.log({ carouselImageShas })

        const preparedRelease = await prepareRelease(manifestFile, storeName, storeDescription, releaseNotes, tagline, tags, authnToken, category, cookie);
        console.log('...Release Prepared');
        const preparedVersionId = preparedRelease.version_id;
        const signature = preparedRelease.signature;

        // await uploadIconBundle('dist/icon.png', preparedRelease.icon_upload_url);
        // await uploadCoverImageBundle('dist/cover.png', preparedRelease.cover_image_upload_url);
        
        // if (preparedRelease.carousel_images) {
        //     let i = 0;
        //     for (const carouselImage of carouselImages) {
        //         if (preparedRelease.carousel_images[i]) {
        //             await uploadCarouselImages(carouselImage, preparedRelease.carousel_images[i]);
        //             console.log('Creating and uploading cover image...', preparedRelease.carousel_images[i].url, carouselImage);
        //         }
        //         i++;
        //     }
        // }

        console.log('Creating and uploading code bundle....');
        await uploadCodeBundle(manifestFile, preparedRelease.code_upload_url);
        console.log('...Creation and Upload done');

        console.log('Releasing prepared Publishing version (' + preparedRelease.version_id + ')...');
        const publishedVersion = await publishRelease(manifestFile, preparedVersionId, signature, authnToken, cookie, carouselMedia, carouselVideos);
        console.log('Version '+ publishedVersion.plugin.versions[preparedVersionId].version +' (' + preparedVersionId + ') published');

        })

        await program.parseAsync();
}

main();