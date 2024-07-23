const fs = require('fs');
const read = require('read');
const cookie = require('cookie');
const { getFigmaCookie } = require('./figma-helper');

let figmaEmail;
let figmaPassword;

const figmaUrl = 'https://www.figma.com/';

function cookiesSufficient(cookies) {
    return cookies.length > 0 && cookies.findIndex(cookie => cookie.name === 'recent_user_data') >= 0;
}

async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports = {
    authenticate: async function ({ cookie: figmaCookie, tsid }) {
        if (!figmaEmail) {
            figmaEmail = await read({
                prompt: 'Please enter the email address of your Figma account:',
            });
        }


        if (!figmaPassword) {
            figmaPassword = await read({
                prompt: 'Please enter your Figma password:',
                silent: true,
            })
        }
        if ([figmaCookie, tsid].includes(undefined)) {
            const figmaCookies = await getFigmaCookie();
            figmaCookie = figmaCookies.cookie;
            tsid = figmaCookies.tsid;
            console.log('\n');
            console.log('Cookie argument missing, automatically retrieving fresh session cookies to start authentication');
            console.log(`FIGMA_COOKIE='${figmaCookie}'; FIGMA_TSID=${tsid}`);
        }

        const secondFactorTriggerLogin = await fetch("https://www.figma.com/api/session/login", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                "tsid": tsid,
                "cookie": figmaCookie,
                "x-csrf-bypass": "yes",
            },
            "referrer": "https://www.figma.com/login",
            "referrerPolicy": "origin-when-cross-origin",
            "body": JSON.stringify({
                email: figmaEmail,
                username: figmaEmail,
                password: figmaPassword,
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        const secondFactorTriggerLoginResult = await secondFactorTriggerLogin.json();
        //console.log(secondFactorTriggerLoginResult);
        if (secondFactorTriggerLogin.status === 429) {
            throw new Error('Rate limit hit... try again later');
        } else if (secondFactorTriggerLogin.status === 401) {
            throw new Error("Wrong credentials... " + (secondFactorTriggerLogin.message || ''));
        } else if (secondFactorTriggerLogin.status === 400
            && (secondFactorTriggerLoginResult.reason === undefined
                || secondFactorTriggerLoginResult.reason.missing === undefined)) {
            console.log('something went wrong - got 400 but expected two factor request');
            throw new Error('something went wrong - got 400 but expected two factor request');
        } else if (secondFactorTriggerLogin.status !== 400) {
            console.log('something went wrong - expected two factor response but got status' + secondFactorTriggerLogin.status);
        }

        const secondFactor = secondFactorTriggerLoginResult.reason.phone_number ? await read({
            prompt: 'SMS sent to number ending in (' + secondFactorTriggerLoginResult.reason.phone_number + '): please enter the Authentication code:'
        }) : await read({
            prompt: 'Please enter the TOTP authentication code:'
        });

        const loginResponse = await fetch("https://www.figma.com/api/session/login", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                "tsid": tsid,
                "cookie": figmaCookie,
                "x-csrf-bypass": "yes",
            },
            "referrer": "https://www.figma.com/login",
            "referrerPolicy": "origin-when-cross-origin",
            "body": JSON.stringify({
                email: figmaEmail,
                username: figmaEmail,
                password: figmaPassword,
                totp_key: secondFactor,
            }),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        try {
            const loginResponseResult = await loginResponse.json();
            console.log(JSON.stringify(loginResponseResult))
        } catch (err) {}

        const cookiesReceived = loginResponse.headers?.getSetCookie()
        let authnTokenCookie = undefined;
        cookiesReceived.forEach((rawCookie) => {
            const parsedCookie = cookie.parse(rawCookie);
            if (parsedCookie['__Host-figma.authn']) {
                authnTokenCookie = encodeURIComponent(parsedCookie['__Host-figma.authn']);
            }
        });
        if (!authnTokenCookie) {
            throw new Error("Authn cookie not found");
        }

        console.log('Authentication was successfull please add the following variable in your environment');
        console.log('FIGMA_WEB_AUTHN_TOKEN=' + authnTokenCookie);

    }
}

