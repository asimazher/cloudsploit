var expect = require('chai').expect;
var wafLogsEnabled = require('./wafLogsEnabled.js');

const profiles = [
    {
        "id": "/subscriptions/234/resourcegroups/sadeedrg/providers/Microsoft.Cdn/profiles/test-profile",
        "type": "Microsoft.Cdn/profiles",
        "name": "test-profile",
        "location": "Global",
        "kind": "frontdoor",
        "tags": {},
        "sku": {
            "name": "Standard_Microsoft"
        },
        "properties": {
            "resourceState": "Active",
            "provisioningState": "Succeeded"
        }
    },
    {
        "id": "/subscriptions/234/resourcegroups/sadeedrg/providers/Microsoft.Cdn/profiles/test-profile",
        "type": "Microsoft.Cdn/profiles",
        "name": "test-profile",
        "location": "Global",
        "kind": "frontdoor",
        "tags": {},
        "sku": {
            "name": "Standard_Microsoft"
        },
        "properties": {
            "resourceState": "Active",
            "provisioningState": "Succeeded"
        }
    }
];


const diagnosticSettings = [
    {
        id: '/subscriptions/26a1a07e-06dd-4892-92c9-e4996b0fc546/resourcegroups/cloudsploit-dev/providers/microsoft.cdn/profiles/omer-cdn-profile-test/providers/microsoft.insights/diagnosticSettings/testaccesslogs',
        type: 'Microsoft.Insights/diagnosticSettings',
        name: 'testaccesslogs',
        location: 'global',
        logs: [
            {
              "category": "FrontDoorAccessLog",
              "categoryGroup": null,
              "enabled": true,
              "retentionPolicy": {
                "enabled": false,
                "days": 0
              }
            },
          ],
          "logAnalyticsDestinationType": null
    },
    {
        id: '/subscriptions/26a1a07e-06dd-4892-92c9-e4996b0fc546/resourcegroups/cloudsploit-dev/providers/microsoft.cdn/profiles/omer-cdn-profile-test/providers/microsoft.insights/diagnosticSettings/testaccesslogs',
        type: 'Microsoft.Insights/diagnosticSettings',
        name: 'testwaflogs',
        location: 'global',
        logs: [
            {
              "category": "FrontDoorWebApplicationFirewallLog",
              "categoryGroup": null,
              "enabled": true,
              "retentionPolicy": {
                "enabled": false,
                "days": 0
              }
            },
          ],
          "logAnalyticsDestinationType": null
    },
    {}
]

const createCache = (profiles, diagnostics) => {
    let diagnostic = {};
    if (profiles.length) {
        diagnostic[profiles[0].id] = {
            data: diagnostics
        };
    }


    return {
        profiles: {
            list: {
                'global': {
                    data: profiles
                }
            }
        },
        diagnosticSettings: {
            listByAzureFrontDoor: {
                'global': diagnostic
            }
        }
    };
};

const createErrorCache = (key) => {
    if (key == 'profile') {
        return {
            profiles: {
                list: {
                    'global': {}
                }
            }
        };
    } else if (key === 'noprofile'){
        return {
            profiles: {
                list: {
                    'global': {
                        data:{}
                    }
                }
            }
        };
    }else if (key === 'diagnostic') {
        return {
            profiles: {
                list: {
                    'global': {
                        data: [profiles[0]]
                    }
                }
            },
            diagnosticSettings: {
                listByAzureFrontDoor: {
                    'global': {}
                }
            }
        };
    } else {
        const profileId = (profiles && profiles.length) ? profiles[0].id : null;
        const diagnosticSetting = (diagnosticSettings && diagnosticSettings.length) ? diagnosticSettings[0].id : null;
        return {
            profiles: {
                list: {
                    'global': {
                        data: [profiles[0]]
                    }
                }
            },
            diagnosticSettings: {
                listByAzureFrontDoor: {
                    'global': {
                        data: {}
                    }
                }
            }
        };
    }
};

describe('wafLogsEnabled', function () {
    describe('run', function () {

        it('should give pass result if No existing Azure Front Door profiles found', function (done) {
            const cache = createErrorCache('noprofile');
            wafLogsEnabled.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('No existing Azure Front Door profiles found');
                expect(results[0].region).to.equal('global');
                done();
            });
        });

        it('should give unknown result if Unable to query Front Door profiles:', function (done) {
            const cache = createErrorCache('profile');
            wafLogsEnabled.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(3);
                expect(results[0].message).to.include('Unable to query Front Door profiles:');
                expect(results[0].region).to.equal('global');
                done();
            });
        });

        it('should give unknown result if Unable to query diagnostics settings', function (done) {
            const cache = createErrorCache('policy');
            wafLogsEnabled.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(3);
                expect(results[0].message).to.include('Unable to query Front Door diagnostics settings');
                expect(results[0].region).to.equal('global');
                done();
            });
        });

        it('should give passing result if Front Door profile WAF logs are enabled for Azure Front Door', function (done) {
            const cache = createCache([profiles[0]], [diagnosticSettings[1]]);
            wafLogsEnabled.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('Front Door profile WAF logs are enabled');
                expect(results[0].region).to.equal('global');
                done();
            });
        });

        it('should give failing result if Front Door profile WAF logs are not enabled for Azure Front Door', function (done) {
            const cache = createCache([profiles[1]], [diagnosticSettings[0]]);
            wafLogsEnabled.run(cache, {}, (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(2);
                expect(results[0].message).to.include('Front Door profile WAF logs are not enabled');
                expect(results[0].region).to.equal('global');
                done();
            });
        });
    });
});