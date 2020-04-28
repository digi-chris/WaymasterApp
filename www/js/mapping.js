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
        navigator.geolocation.getCurrentPosition(positionCallback);
        navigator.geolocation.watchPosition(positionUpdate);
    } else {
        //getMap();
        //window.onresize();
    }
}

function positionCallback(position) {
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
    user_lat = position.coords.latitude;
    user_lng = position.coords.longitude;
    //window.onresize();
}

function isCanvasSupported(){
  var elem = document.createElement('canvas');
  return !!(elem.getContext && elem.getContext('2d'));
}

var consoleBytes;
var consoleBuffer = [];
var overlayBuffer = [];
var arrayPos = 0;

for(var y = 0; y < rows; y++) {
    consoleBuffer[y] = [];
    overlayBuffer[y] = [];
    for(var x = 0; x < cols; x++) {
        consoleBuffer[y][x] = {
            char: 32,
            foreground: 0,
            background: 0
        };
        overlayBuffer[y][x] = {
            char: null,
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

    xhr.open("GET", "/api/map/data?lat=" + lat + "&lng=" + lng + "&zoom=" + zoom + "&cols=" + cols + "&rows=" + rows + "&user_lat=" + user_lat + "&user_lng=" + user_lng + "&logo=" + displayLogo);
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
        xhr.open("GET", "/api/geocoding/reverse?lat=" + lat + "&lon=" + lon);
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

function drawString(text, col, row, backgroundColor, foregroundColor, drawOnOverlay, webControl) {
    for(var i = 0; i < text.length; i++) {
        var cCode = text.charCodeAt(i);
        drawCharacter(cCode, col + i, row, backgroundColor, foregroundColor, null, drawOnOverlay, webControl);
    }
}

var borders = {
    "singleLine": {
        "topLeft": 218,
        "topRight": 191,
        "bottomRight": 217,
        "bottomLeft": 192,
        "horizontal": 196,
        "vertical": 179
    },
    "doubleLine": {
        "topLeft": 201,
        "topRight": 187,
        "bottomRight": 188,
        "bottomLeft": 200,
        "horizontal": 205,
        "vertical": 186
    },
    "noBorder": {
        "topLeft": 32,
        "topRight": 32,
        "bottomRight": 32,
        "bottomLeft": 32,
        "horizontal": 32,
        "vertical": 32
    },
    "bevel": {
        "topLeft": { charCode: 258, invert: true, background: 15 },
        "topRight": 258,
        "bottomRight": { charCode: 257, invert: true },
        "bottomLeft": 258,
        "top": { charCode: 223, foreground: 15 },
        "bottom": 220,
        "left": { charCode: 221, foreground: 15 },
        "right": 222
    }
};

function drawRectangle(fromCol, fromRow, toCol, toRow, backgroundColor, foregroundColor, lineStyle, fill, onOverlay, webControl) {
    drawCharacter(borders[lineStyle].topLeft, fromCol, fromRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
    drawCharacter(borders[lineStyle].topRight, toCol, fromRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
    drawCharacter(borders[lineStyle].bottomRight, toCol, toRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
    drawCharacter(borders[lineStyle].bottomLeft, fromCol, toRow, backgroundColor, foregroundColor, false, onOverlay, webControl);

    var i;
    for (i = fromCol + 1; i < toCol; i++) {
        if (borders[lineStyle].horizontal) {
            drawCharacter(borders[lineStyle].horizontal, i, fromRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
            drawCharacter(borders[lineStyle].horizontal, i, toRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
        } else {
            drawCharacter(borders[lineStyle].top, i, fromRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
            drawCharacter(borders[lineStyle].bottom, i, toRow, backgroundColor, foregroundColor, false, onOverlay, webControl);
        }
    }

    for (i = fromRow + 1; i < toRow; i++) {
        if (borders[lineStyle].vertical) {
            drawCharacter(borders[lineStyle].vertical, fromCol, i, backgroundColor, foregroundColor, false, onOverlay, webControl);
            drawCharacter(borders[lineStyle].vertical, toCol, i, backgroundColor, foregroundColor, false, onOverlay, webControl);
        } else {
            drawCharacter(borders[lineStyle].left, fromCol, i, backgroundColor, foregroundColor, false, onOverlay, webControl);
            drawCharacter(borders[lineStyle].right, toCol, i, backgroundColor, foregroundColor, false, onOverlay, webControl);
        }
    }

    if (fill) {
        for (var y = fromRow + 1; y < toRow; y++) {
            for (var x = fromCol + 1; x < toCol; x++) {
                drawCharacter(32, x, y, backgroundColor, foregroundColor, false, onOverlay, webControl);
            }
        }
    }
}

var isRendering = false;
var mustRender = false;
var renderTimeout = null;

var canvasChars = [];

function createChars() {
    var fontImage;
    for (var f = 0; f < 2; f++) {
        if (f === 0) {
            fontImage = font;
        } else {
            fontImage = font2;
        }

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
                document.body.appendChild(c);

                var ctx = c.getContext("2d");
                ctx.save();
                ctx.clearRect(0, 0, cW, cH);
                ctx.drawImage(fontImage, srcX, srcY, cW, cH, 0, 0, cW, cH);
                ctx.fillStyle = consoleChars[foregroundColor];
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillRect(0, 0, cW, cH);
                ctx.restore();

                if (foregroundColor === 0) {
                    canvasChars[i + (256 * f)] = [];
                }
                canvasChars[i + (256 * f)][foregroundColor] = c;
            }
        }
    }
}

function drawCharacter(charCode, col, row, backgroundColor, foregroundColor, dontRender, drawOnOverlay, webControl) {
    var charObj = null;
    if (charCode.charCode) {
        charObj = charCode;
        charCode = charObj.charCode;

        if (charObj.invert) {
            var fColor = backgroundColor;
            backgroundColor = foregroundColor;
            foregroundColor = fColor;
        }

        if (charObj.background) {
            backgroundColor = charObj.background;
        }

        if (charObj.foreground) {
            foregroundColor = charObj.foreground;
        }
    }

    if (col < cols && row < rows) {
        var drawBuffer;

        if (drawOnOverlay) {
            drawBuffer = overlayBuffer;
        } else {
            drawBuffer = consoleBuffer;
        }

        // only bother drawing if char has changed
        if (drawBuffer[row][col].char !== charCode || drawBuffer[row][col].foreground !== foregroundColor || drawBuffer[row][col].background !== backgroundColor) {
            var srcRow = Math.floor(charCode / srcColWidth);
            var srcCol = charCode - (srcRow * srcColWidth);
            var srcX = srcCol * cW;
            var srcY = srcRow * cH;

            //bufferCtx.save();
            //bufferCtx.clearRect(0, 0, cW, cH);
            //bufferCtx.drawImage(font, srcX, srcY, cW, cH, 0, 0, cW, cH);
            //bufferCtx.fillStyle = consoleChars[foregroundColor];
            //bufferCtx.globalCompositeOperation = 'source-in';
            //bufferCtx.fillRect(0, 0, cW, cH);
            //bufferCtx.restore();

            //ctx.drawImage(buffer, 0, 0, cW, cH, col * cW, row * cH, cW, cH);
            drawBuffer[row][col].char = charCode;
            drawBuffer[row][col].foreground = foregroundColor;
            drawBuffer[row][col].background = backgroundColor;
            drawBuffer[row][col].webControl = webControl;

            if (overlayBuffer[row][col].char !== null) {
                ctx.fillStyle = consoleChars[overlayBuffer[row][col].background];
                ctx.fillRect(col * cW, row * cH, cW, cH);
                ctx.drawImage(canvasChars[overlayBuffer[row][col].char][overlayBuffer[row][col].foreground], 0, 0, cW, cH, col * cW, row * cH, cW, cH);
            } else {
                ctx.fillStyle = consoleChars[backgroundColor];
                ctx.fillRect(col * cW, row * cH, cW, cH);
                ctx.drawImage(canvasChars[charCode][foregroundColor], 0, 0, cW, cH, col * cW, row * cH, cW, cH);
            }

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


// Load the font image and draw when it's ready
console.log('load font');
var font = new Image();
font.onload = draw;
font.src = "fonts/font_ibm_vga8.png";

var font2 = new Image();
font2.onload = draw;
font2.src = "fonts/font_ibm_vga_extended.png";

var fontCount = 0;

function draw() {
    fontCount++;
    srcColWidth = (font.width / cW);
    //console.log(srcColWidth);

    if (fontCount === 2) {
        createChars();
        getLocation();
    }

    //drawRectangle(1, 1, 10, 5, 4, 15, "singleLine", true, true);
    //drawRectangle(30, 2, 36, 7, 4, 15, "doubleLine", false, true);
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

function WebControls_Loaded() {
    console.log('WebControls_Loaded');
    var upBtn = new TextButton(69, 18, String.fromCharCode(24));
    var downBtn = new TextButton(69, 21, String.fromCharCode(25));
    var rightBtn = new TextButton(74, 21, String.fromCharCode(26));
    var leftBtn = new TextButton(64, 21, String.fromCharCode(27));

    var zoomInBtn = new TextButton(74, 1, "+");
    var zoomOutBtn = new TextButton(74, 4, "-");

    zoomInBtn.addEventListener("click", () => {
        dist /= 2;
        zoom--;
        getMap();
    });

    zoomOutBtn.addEventListener("click", () => {
        dist *= 2;
        zoom++;
        getMap();
    });

    upBtn.addEventListener("click", () => {
        lat += dist / 4;
        getMap();
    });

    downBtn.addEventListener("click", () => {
        lat -= dist / 4;
        getMap();
    });

    leftBtn.addEventListener("click", () => {
        lng -= dist / 2;
        getMap();
    });

    rightBtn.addEventListener("click", () => {
        lng += dist / 2;
        getMap();
    });
}

var webControlUnderMouse = null;
var webControlFocus = null;

["mousemove", "mousedown", "mouseup", "click"].forEach((item) => {
    document.body.addEventListener(item, (e) => {
        var col = Math.floor(((e.clientX - offsetX) / screenWidth) * cols);
        var row = Math.floor(((e.clientY - offsetY) / screenHeight) * rows);

        e.consoleX = col;
        e.consoleY = row;

        if (overlayBuffer[row][col].webControl) {
            if (webControlUnderMouse !== overlayBuffer[row][col].webControl) {
                if (webControlUnderMouse !== null) {
                    if (webControlUnderMouse.mouseleave) {
                        webControlUnderMouse.mouseleave();
                    }
                }
                webControlUnderMouse = overlayBuffer[row][col].webControl;
                if (webControlUnderMouse.mouseenter) {
                    webControlUnderMouse.mouseenter();
                }
            }

            if (overlayBuffer[row][col].webControl[item]) {
                overlayBuffer[row][col].webControl[item](e);
            }
        } else {
            if (webControlUnderMouse !== null) {
                if (webControlUnderMouse.mouseleave) {
                    webControlUnderMouse.mouseleave();
                }
                webControlUnderMouse = null;
            }
        }

        if (item === "mousedown") {
            if (webControlUnderMouse !== webControlFocus) {
                if (webControlFocus !== null) {
                    if (webControlFocus.lostFocus) {
                        webControlFocus.lostFocus();
                    }
                }

                webControlFocus = webControlUnderMouse;
                if (webControlFocus !== null) {
                    if (webControlFocus.gotFocus) {
                        webControlFocus.gotFocus();
                    }
                }
            }
        }
    });
});

document.body.addEventListener("click", (e) => {
    if (displayLogo) {
        displayLogo = false;
        getMap();
    }
});