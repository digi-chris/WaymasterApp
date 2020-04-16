cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-screensize/www/screensize.js",
        "id": "cordova-plugin-screensize.screensize",
        "pluginId": "cordova-plugin-screensize",
        "clobbers": [
            "window.plugins.screensize"
        ]
    },
    {
        "file": "plugins/cordova-plugin-screensize/src/browser/ScreenSizeProxy.js",
        "id": "cordova-plugin-screensize.ScreenSizeProxy",
        "pluginId": "cordova-plugin-screensize",
        "runs": true
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-whitelist": "1.3.4",
    "cordova-plugin-geolocation": "4.0.2",
    "cordova-plugin-screensize": "1.3.1"
}
// BOTTOM OF METADATA
});