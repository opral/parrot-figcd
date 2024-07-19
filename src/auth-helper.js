const fs = require('fs');
const read = require('read');
const cookie = require('cookie');

let figmaEmail;
let figmaPassword;

const figmaCookie = process.env.FIGMA_COOKIE;
const figmaTsid = process.env.FIGMA_TSID;

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
    authenticate: async function () {
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

        const secondFactorTriggerLogin = await fetch("https://www.figma.com/api/session/login", {
            "headers": {
                "accept": "application/json",
                "content-type": "application/json",
                "tsid": figmaTsid,
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
            console.log(secondFactorTriggerLogin.message);
            throw new Error("Wrong credentials..." + JSON.stringify(secondFactorTriggerLogin) + secondFactorTriggerLogin.message);
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
                "tsid": figmaTsid,
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
        // const loginResponseResult = await loginResponse.json();

        const cookiesReceived = loginResponse.headers?.getSetCookie()
        const authnTokenCookie = {
            name: '__Host-figma.authn',
            value: undefined
        };
        cookiesReceived.forEach(rawCookie => {
            const parsedCookie = cookie.parse(rawCookie);
            if (parsedCookie[authnTokenCookie.name]) {
                authnTokenCookie.value = encodeURIComponent(parsedCookie[authnTokenCookie.name]);
            }
        });

        console.log('Authentication was successfull please add the following variable in your environment');
        console.log('FIGMA_WEB_AUTHN_TOKEN=' + authnTokenCookie.value);

    }
}

