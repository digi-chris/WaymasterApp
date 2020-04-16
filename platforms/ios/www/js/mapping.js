var displayLogo = true;
var dist = 0.003706;
var zoom = 2;
var rows = 25;
var cols = 80;
var video = new Image();
var usingWebGl = true;
// Visible stage
var stage = document.getElementById("stage");
var ctx = stage.getContext("2d");
// Buffer used for compositing fonts
var buffer = document.getElementById("buffer");
var bufferCtx = buffer.getContext("2d");
var videoHasLoaded = false;

var cW = 8;
var cH = 16;

var rootURL = "https://waymaster.com"

video.onload = function() {
    videoHasLoaded = true;
};

function isWebGlAvailable() {
    //usingWebGl = false;
    //return false;
    var canvas = document.createElement("canvas");
    var gl = canvas.getContext("webgl")
      || canvas.getContext("experimental-webgl");

    if (gl && gl instanceof WebGLRenderingContext) {
        usingWebGl = true;
        return true;
    } else {
        usingWebGl = false;
        return false;
    }
}

function getLocation() {
    if (navigator.geolocation) {
        console.log('getCurrentPosition');
        navigator.geolocation.getCurrentPosition(positionCallback, positionError, {timeout: 10000, enableHighAccuracy: true });
        navigator.geolocation.watchPosition(positionUpdate, positionError, {timeout: 10000, enableHighAccuracy: true });
    } else {
        //getMap();
        //window.onresize();
    }
}

var positionStarted = false;
function positionCallback(position) {
    positionStarted = true;
    console.log('positionCallback');
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    user_lat = lat;
    user_lng = lng;
    getMap();
    reverseSearch(lat, lng)
        .then((results) => {
            console.log(results);
            if(results) {
                if(results.features && results.features.length > 0) {
                    setTimeout(() => {
                        drawString("Current Location: " + results.features[0].properties.name, 1, 1, 0, 15);
                    }, 5000);
                }
            }
        })
        .catch((err) => {
            console.log(err);
        });
    //window.onresize();
}

function positionUpdate(position) {
    if (!positionStarted) {
        positionCallback(position);
    } else {
        console.log('positionUpdate');
        user_lat = position.coords.latitude;
        user_lng = position.coords.longitude;
    }
    //window.onresize();
}

function positionError(e) {
    console.error("GPS Position error:", e);
}

function isCanvasSupported(){
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
}

var consoleBytes;
var consoleBuffer = [];
var arrayPos = 0;

for(var y = 0; y < rows; y++) {
    consoleBuffer[y] = [];
    for(var x = 0; x < cols; x++) {
        consoleBuffer[y][x] = {
            char: 32,
            foreground: 0,
            background: 0
        };
    }
}
console.log(consoleBuffer);

var lastRender;

function drawNextChar(dontRender)
{
    if(consoleBytes) {
        var x = (arrayPos / 2) % cols;
        var y = ((arrayPos / 2) - x) / cols;
        var colorByte = arrayPos;
        var nibble1 = consoleBytes[colorByte] & 0xF;
        var nibble2 = consoleBytes[colorByte] >> 4;
        var charByte = arrayPos + 1;
        //rowString += "(" + nibble1 + "," + nibble2 + ")" + String.fromCharCode(byteArray[charByte]);
        //rowString += String.fromCharCode(consoleBytes[charByte]) + "(" + consoleBytes[charByte] + ")";
        if(consoleBuffer[y]) {
            var currentChar = consoleBuffer[y][x];
            if(currentChar.char !== consoleBytes || currentChar.foreground !== nibble1 || currentChar.background !== nibble2) {
                drawCharacter(consoleBytes[charByte], x, y, nibble1, nibble2, dontRender);
            }
        } else {
            console.log('Y: ' + y + ' doesn\'t exist!');
        }
        //console.log(consoleBytes[charByte]);

        arrayPos = arrayPos + 2;
        //if(arrayPos > consoleBytes.length) {
        //    arrayPos = 0;
        //}
    }
    
    if(arrayPos < consoleBytes.length) {
        if(new Date() - lastRender > 20) {
            setTimeout(drawNextChar, 0);
        } else {
            drawNextChar(true);
        }
    } else {
        console.log("Redraw finished.");
        if(dontRender) {
            // we're not going to draw anything else, but dontRender === true.. we should draw regardless.
            var dataURL = stage.toDataURL("image/png");
            //videoHasLoaded = false;
            //video.src = dataURL;
            var newVideo = new Image();
            newVideo.src = dataURL;
            newVideo.onload = function() { videoTexture.image = newVideo; videoTexture.needsUpdate = true; };
        }
    }
}

function redrawConsole() {
    lastRender = new Date();
    console.log("Redraw started");
    arrayPos = 0;
    drawNextChar(true);
}

var startedWebgl = false;

function getMap() {
    var xhr = new XMLHttpRequest();
    //var wasDisplayLogo = displayLogo;
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        console.log(this.response);

        var arrayBuffer = this.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            consoleBytes = new Uint8Array(arrayBuffer);
            redrawConsole();
        }

        //if (wasDisplayLogo) {
        //    setTimeout(getMap, 5000);
        //}
    };

    xhr.open("GET", rootURL + "/api/map/data?lat=" + lat + "&lng=" + lng + "&zoom=" + zoom + "&cols=" + cols + "&rows=" + rows + "&user_lat=" + user_lat + "&user_lng=" + user_lng + "&logo=" + displayLogo);
    xhr.send();
    //displayLogo = false;
    if(!startedWebgl) {
        startedWebgl = true;
        if(isWebGlAvailable()) {
            init();
            animate();
        } else {
            window.addEventListener('resize', onResize, false);
            onResize();
            document.getElementById('stage').style.display = "";
        }
    }
}

function reverseSearch(lat, lon) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.responseType = "json";
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 400) {
                resolve(this.response);
            } else {
                reject(this);
            }
        }
        xhr.open("GET", rootURL + "/api/geocoding/reverse?lat=" + lat + "&lon=" + lon);
        xhr.send();
    });
}


var srcColWidth;
var consoleChars = [
    "#000000",
    "#000080",
    "#008000",
    "#008080",
    "#800000",
    "#800080",
    "#808000",
    "#C0C0C0",
    "#808080",
    "#0000FF",
    "#00FF00",
    "#00FFFF",
    "#FF0000",
    "#FF00FF",
    "#FFFF00",
    "#FFFFFF"
];

function drawString(text, col, row, backgroundColor, foregroundColor) {
    for(var i = 0; i < text.length; i++) {
        var cCode = text.charCodeAt(i);
        drawCharacter(cCode, col + i, row, backgroundColor, foregroundColor);
    }
}

var isRendering = false;
var mustRender = false;
var renderTimeout = null;

var canvasChars = [];

function createChars() {
    var charCache = document.getElementById("charCache");
    for (var i = 0; i < 256; i++) {
        var charCode = i;
        for (var foregroundColor = 0; foregroundColor < 16; foregroundColor++) {
            var srcRow = Math.floor(charCode / srcColWidth);
            var srcCol = charCode - (srcRow * srcColWidth);
            var srcX = srcCol * cW;
            var srcY = srcRow * cH;

            var c = document.createElement("canvas");
            c.width = cW;
            c.height = cH;
            c.style.display = "none";
            charCache.appendChild(c);

            var ctx = c.getContext("2d");
            ctx.save();
            ctx.clearRect(0, 0, cW, cH);
            ctx.drawImage(font, srcX, srcY, cW, cH, 0, 0, cW, cH);
            ctx.fillStyle = consoleChars[foregroundColor];
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillRect(0, 0, cW, cH);
            ctx.restore();

            if (foregroundColor === 0) {
                canvasChars[i] = [];
            }
            canvasChars[i][foregroundColor] = c;
        }
    }
}

function drawCharacter(charCode, col, row, backgroundColor, foregroundColor, dontRender) {
    if (col < cols && row < rows) {
        // only bother drawing if char has changed
        if (consoleBuffer[row][col].char !== charCode || consoleBuffer[row][col].foreground !== foregroundColor || consoleBuffer[row][col].background !== backgroundColor) {
            var srcRow = Math.floor(charCode / srcColWidth);
            var srcCol = charCode - (srcRow * srcColWidth);
            var srcX = srcCol * cW;
            var srcY = srcRow * cH;
            ctx.fillStyle = consoleChars[backgroundColor];
            ctx.fillRect(col * cW, row * cH, cW, cH);

            //bufferCtx.save();
            //bufferCtx.clearRect(0, 0, cW, cH);
            //bufferCtx.drawImage(font, srcX, srcY, cW, cH, 0, 0, cW, cH);
            //bufferCtx.fillStyle = consoleChars[foregroundColor];
            //bufferCtx.globalCompositeOperation = 'source-in';
            //bufferCtx.fillRect(0, 0, cW, cH);
            //bufferCtx.restore();

            //ctx.drawImage(buffer, 0, 0, cW, cH, col * cW, row * cH, cW, cH);
            ctx.drawImage(canvasChars[charCode][foregroundColor], 0, 0, cW, cH, col * cW, row * cH, cW, cH);

            consoleBuffer[row][col].char = charCode;
            consoleBuffer[row][col].foreground = foregroundColor;
            consoleBuffer[row][col].background = backgroundColor;
            if (!dontRender) {
                //lastRender = new Date();
                //if (!isRendering) {
                //    forceRender();
                //} else {
                //    mustRender = true;
                //}
                forceRender();
            }
        }
    }
}

function forceRender() {
    lastRender = new Date();
    renderTimeout = null;
    isRendering = true;
    var dataURL = stage.toDataURL("image/png");
    //videoHasLoaded = false;
    //video.src = dataURL;
    var newVideo = new Image();
    newVideo.src = dataURL;
    newVideo.onload = function () {
        videoTexture.image = newVideo;
        videoTexture.needsUpdate = true;
        isRendering = false;

        if (mustRender) {
            mustRender = false;
            forceRender();
        }
    };
}


var font;

function initMapping() {
    // Load the font image and draw when it's ready
    font = new Image();
    console.log('load font');
    font.onload = draw;
    font.src = "fonts/font_ibm_vga8.png";
}

function draw() {
    console.log('initial draw');
    srcColWidth = (font.width / cW);
    console.log(srcColWidth);
    createChars();
    getLocation();
}

function keyDown(e) {
    if (displayLogo) {
        displayLogo = false;
        getMap();
    } else {
        switch (e.keyCode) {
            case 37:
                // Left
                lng -= dist / 2;
                getMap();
                break;
            case 38:
                // Up
                lat += dist / 4;
                getMap();
                break;
            case 39:
                // Right
                lng += dist / 2;
                getMap();
                break;
            case 40:
                // Down
                lat -= dist / 4;
                getMap();
                break;
            case 189:
            case 107:
                // zoom in;
                dist *= 2;
                zoom++;
                getMap();
                break;
            case 187:
            case 109:
                // zoom out;
                dist /= 2;
                zoom--;
                getMap();
                break;
        }
    }
}
window.addEventListener('keydown', keyDown);
