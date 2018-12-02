
'use strict';
var fs = require('fs');

var Proxy = require('browsermob-proxy').Proxy
const webdriver = require('selenium-webdriver');
const selProxy = require('selenium-webdriver/proxy');
const TestHelper = require('../test/module/testHelper')

var proxy = new Proxy({ host: proxyHost }),
proxyHost = 'localhost';

proxy.start(function(err, data) {
    if (!err) {
        proxy.startHAR(
            data.port, 
            'http://localhost:8004',
            {
                'captureContent':'true',
                'captureHeaders':'true',
                'captureBinaryContent':'true'
            },
            function (err) {
                if (!err) {
                    // DO WHATEVER WEB INTERACTION YOU WANT USING THE PROXY
                    doSeleniumStuff(proxyHost + ':' +  data.port, function () {
                        proxy.getHAR(data.port, function(err, resp) {
                            if (!err) {
                                console.log(resp);
                                fs.writeFileSync('output.har', resp, 'utf8');
                            } else {
                                console.err('Error getting HAR file: ' + err);
                            }
                            proxy.stop(data.port, function() {});
                        });
                    });
                } else {
                    console.error('Error starting HAR: ' + err);
                    proxy.stop(data.port, function () {
                    });
                }
        });
    } else {
        console.error('Error starting proxy: ' + err);
    }
});

proxy.cbHAR({
    'name':'test',
    'captureContent':'true',
    'captureHeaders':'true',
    'captureBinaryContent':'true'
    }, doSeleniumStuff, function(err, data) {
    if (err) {
        console.error('ERR: ' + err);
    } else {
        fs.writeFileSync('stuff.har', data, 'utf8');
    }
});

async function doSeleniumStuff(proxy, cb) {
    let driver = new webdriver.Builder()
    .withCapabilities(TestHelper.getCapabilities('chrome'))
    .setProxy(selProxy.manual(TestHelper.getManualProxy(proxy.port)))
    .build();

    await driver.get(TestHelper.TEST_PAGE_URL)
    .then(cb);
}