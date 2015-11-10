var config;
if (typeof(require) === 'undefined') {
    /* XXX: Hack to work around r.js's stupid parsing.
    * We want to save the configuration in a variable so that we can reuse it in
    * tests/main.js.
    */
    require = {
        config: function (c) {
            config = c;
        }
    };
}

require.config({
    baseUrl: '.',
    paths: {
        "backbone":                 "components/backbone/backbone",
        "backbone.browserStorage":  "components/backbone.browserStorage/backbone.browserStorage",
        "backbone.overview":        "components/backbone.overview/backbone.overview",
        "bootstrap":                "components/bootstrap/dist/js/bootstrap",           // XXX: Only required for https://conversejs.org website
        "bootstrapJS":              "components/bootstrapJS/index",                     // XXX: Only required for https://conversejs.org website
        "webim-dependencies":       "src/deps-full",
        "webim-templates":          "src/templates",
        "eventemitter":             "components/otr/build/dep/eventemitter",
        "jquery":                   "components/jquery/dist/jquery",
        "jquery-private":           "src/jquery-private",
        "jquery.browser":           "components/jquery.browser/index",
        "jquery.easing":            "components/jquery-easing-original/index",          // XXX: Only required for https://conversejs.org website
        "moment":                   "components/momentjs/moment",
        "strophe":                  "components/strophe/strophe",
        "strophe.disco":            "components/strophejs-plugins/disco/strophe.disco",
        "strophe.muc":              "components/strophe.muc/index",
        "strophe.roster":           "src/strophe.roster",
        "strophe.vcard":            "components/strophejs-plugins/vcard/strophe.vcard",
        "text":                     'components/requirejs-text/text',
        "tpl":                      'components/requirejs-tpl-jcbrand/tpl',
        "typeahead":                "components/typeahead.js/index",
        "underscore":               "components/underscore/underscore",
        "utils":                    "src/utils",

        // Off-the-record-encryption
        "bigint":               "src/bigint",
        "crypto":               "src/crypto",
        "crypto.aes":           "components/otr/vendor/cryptojs/aes",
        "crypto.cipher-core":   "components/otr/vendor/cryptojs/cipher-core",
        "crypto.core":          "components/otr/vendor/cryptojs/core",
        "crypto.enc-base64":    "components/otr/vendor/cryptojs/enc-base64",
        "crypto.evpkdf":        "components/crypto-js-evanvosberg/src/evpkdf",
        "crypto.hmac":          "components/otr/vendor/cryptojs/hmac",
        "crypto.md5":           "components/crypto-js-evanvosberg/src/md5",
        "crypto.mode-ctr":      "components/otr/vendor/cryptojs/mode-ctr",
        "crypto.pad-nopadding": "components/otr/vendor/cryptojs/pad-nopadding",
        "crypto.sha1":         "components/otr/vendor/cryptojs/sha1",
        "crypto.sha256":        "components/otr/vendor/cryptojs/sha256",
        "salsa20":              "components/otr/build/dep/salsa20",
        "otr":                  "src/otr",

        // Locales paths
        "locales":   "locale/locales",
        "jed":       "components/jed/jed",
        "af":        "locale/af/LC_MESSAGES/af",
        "de":        "locale/de/LC_MESSAGES/de",
        "en":        "locale/en/LC_MESSAGES/en",
        "es":        "locale/es/LC_MESSAGES/es",
        "fr":        "locale/fr/LC_MESSAGES/fr",
        "he":        "locale/he/LC_MESSAGES/he",
        "hu":        "locale/hu/LC_MESSAGES/hu",
        "id":        "locale/id/LC_MESSAGES/id",
        "it":        "locale/it/LC_MESSAGES/it",
        "ja":        "locale/ja/LC_MESSAGES/ja",
        "nl":        "locale/nl/LC_MESSAGES/nl",
        "pt_BR":     "locale/pt_BR/LC_MESSAGES/pt_BR",
        "ru":        "locale/ru/LC_MESSAGES/ru",
        "zh":        "locale/zh/LC_MESSAGES/zh",

        // Templates
        "webim_container":                   "src/templates/webim_container",
        "chat_left_panel_top":               "src/templates/chat_left_panel_top",
        "chat_left_panel_tab":               "src/templates/chat_left_panel_tab",
        "chat_left_panel_list":              "src/templates/chat_left_panel_list",
        "chat_left_panel_footer":            "src/templates/chat_left_panel_footer",
        "chat_conversation_list_item":       "src/templates/chat_conversation_list_item",
        "chat_contact_list_item_title":      "src/templates/chat_contact_list_item_title",
        "chat_contact_list_item_detail":     "src/templates/chat_contact_list_item_detail",
        "chat_message_container":            "src/templates/chat_message_container",
        "chat_message_main_panel":           "src/templates/chat_message_main_panel",
        "chat_message":                      "src/templates/chat_message"
    },

    map: {
        // '*' means all modules will get 'jquery-private'
        // for their 'jquery' dependency.
        '*': { 'jquery': 'jquery-private' },
        // 'jquery-private' wants the real jQuery module
        // though. If this line was not here, there would
        // be an unresolvable cyclic dependency.
        'jquery-private': { 'jquery': 'jquery' }
    },

    tpl: {
        // Configuration for requirejs-tpl
        // Use Mustache style syntax for variable interpolation
        templateSettings: {
            evaluate : /\{\[([\s\S]+?)\]\}/g,
            interpolate : /\{\{([\s\S]+?)\}\}/g
        }
    },

    // define module dependencies for modules not using define
    shim: {
        'underscore':           { exports: '_' },
        'crypto.aes':           { deps: ['crypto.cipher-core'] },
        'crypto.cipher-core':   { deps: ['crypto.enc-base64', 'crypto.evpkdf'] },
        'crypto.enc-base64':    { deps: ['crypto.core'] },
        'crypto.evpkdf':        { deps: ['crypto.md5'] },
        'crypto.hmac':          { deps: ['crypto.core'] },
        'crypto.md5':           { deps: ['crypto.core'] },
        'crypto.mode-ctr':      { deps: ['crypto.cipher-core'] },
        'crypto.pad-nopadding': { deps: ['crypto.cipher-core'] },
        'crypto.sha1':          { deps: ['crypto.core'] },
        'crypto.sha256':        { deps: ['crypto.core'] },
        'bigint':               { deps: ['crypto'] },
        'strophe':              { exports: 'Strophe' },
        'strophe.disco':        { deps: ['strophe'] },
        'strophe.muc':          { deps: ['strophe'] },
        'strophe.register':     { deps: ['strophe'] },
        'strophe.roster':       { deps: ['strophe'] },
        'strophe.vcard':        { deps: ['strophe'] }
    }
});

if (typeof(require) === 'function') {
    require(["webim"], function(webim) {
        window.webim = webim;
    });
}
