cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-geolocation.Coordinates",
      "file": "plugins/cordova-plugin-geolocation/www/Coordinates.js",
      "pluginId": "cordova-plugin-geolocation",
      "clobbers": [
        "Coordinates"
      ]
    },
    {
      "id": "cordova-plugin-geolocation.PositionError",
      "file": "plugins/cordova-plugin-geolocation/www/PositionError.js",
      "pluginId": "cordova-plugin-geolocation",
      "clobbers": [
        "PositionError"
      ]
    },
    {
      "id": "cordova-plugin-geolocation.Position",
      "file": "plugins/cordova-plugin-geolocation/www/Position.js",
      "pluginId": "cordova-plugin-geolocation",
      "clobbers": [
        "Position"
      ]
    },
    {
      "id": "cordova-plugin-geolocation.geolocation",
      "file": "plugins/cordova-plugin-geolocation/www/geolocation.js",
      "pluginId": "cordova-plugin-geolocation",
      "clobbers": [
        "navigator.geolocation"
      ]
    },
    {
      "id": "cordova-plugin-screensize.screensize",
      "file": "plugins/cordova-plugin-screensize/www/screensize.js",
      "pluginId": "cordova-plugin-screensize",
      "clobbers": [
        "window.plugins.screensize"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-whitelist": "1.3.4",
    "cordova-plugin-geolocation": "4.0.2",
    "cordova-plugin-screensize": "1.3.1"
  };
});