define("webim-dependencies", [
    "jquery",
    "utils",
    "otr",
    "moment",
    "locales",
    "backbone.browserStorage",
    "backbone.overview",
    "jquery.browser",
    "typeahead",
    "strophe",
    "strophe.muc",
    "strophe.roster",
    "strophe.vcard",
    "strophe.disco",
    "bootstrapJS"
], function($, utils, otr, moment) {
    return {
        'jQuery': $,
        'moment': moment,
        'otr': otr,
        'utils': utils
    };
});
