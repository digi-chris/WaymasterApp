//Bad TV Shader Demo
//Using Three.js r.75
//by Felix Turner / www.airtight.cc / @felixturner

var camera, scene, renderer;
var video, videoTexture, videoMaterial;
var composer;
var shaderTime = 0;
var badTVParams, badTVPass;
var staticParams, staticPass;
var rgbParams, rgbPass;
var filmParams, filmPass;
var renderPass, copyPass;
var gui;
var pnoise, globalParams;
var planeGeometry;
var plane;

function init() {

    camera = new THREE.PerspectiveCamera(55, 1080/ 720, 20, 3000);
    camera.position.z = 1000;
    scene = new THREE.Scene();

    //init video texture
    videoTexture = new THREE.Texture( video );
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    videoMaterial = new THREE.MeshBasicMaterial( {
        map: videoTexture
    } );

    //Add video plane
    planeGeometry = new THREE.PlaneGeometry( 100, 100 ,1,1 );
    plane = new THREE.Mesh( planeGeometry, videoMaterial );
    scene.add( plane );
    plane.z = 0;
    //plane.scale.x = plane.scale.y = 1.45;
    plane.scale.x = window.innerWidth / 100;
    plane.scale.y = window.innerHeight / 100;

    //init renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( 640, 400 );
    document.body.appendChild( renderer.domElement );

    //POST PROCESSING
    //Create Shader Passes
    renderPass = new THREE.RenderPass( scene, camera );
    badTVPass = new THREE.ShaderPass( THREE.BadTVShader );
    rgbPass = new THREE.ShaderPass( THREE.RGBShiftShader );
    filmPass = new THREE.ShaderPass( THREE.FilmShader );
    staticPass = new THREE.ShaderPass( THREE.StaticShader );
    copyPass = new THREE.ShaderPass( THREE.CopyShader );

    //set shader uniforms
    filmPass.uniforms.grayscale.value = 0;

    //Init DAT GUI control panel
    badTVParams = {
        mute:true,
        show: true,
        distortion: 0.4,
        distortion2: 0.6,
        speed: 0.02,
        rollSpeed: 0
    };

    staticParams = {
        show: true,
        amount:0.09,
        size:4.0
    };

    rgbParams = {
        show: true,
        amount: 0.0033,
        angle: 0.2,
    };

    filmParams = {
        show: true,
        count: window.innerHeight * 2,
        sIntensity: 0.8,
        nIntensity: 0.7
    };

    onToggleShaders();
    onToggleMute();
    onParamsChange();

    window.addEventListener('resize', onResize, false);
    //renderer.domElement.addEventListener('click', randomizeParams, false);
    onResize();
    //randomizeParams();

    randomRoll();
    randomDistort2();

    setInterval(revertDist, 60);
}

function onParamsChange() {

    //copy gui params into shader uniforms
    badTVPass.uniforms[ 'distortion' ].value = badTVParams.distortion;
    badTVPass.uniforms[ 'distortion2' ].value = badTVParams.distortion2;
    badTVPass.uniforms[ 'speed' ].value = badTVParams.speed;
    badTVPass.uniforms[ 'rollSpeed' ].value = badTVParams.rollSpeed;

    staticPass.uniforms[ 'amount' ].value = staticParams.amount;
    staticPass.uniforms[ 'size' ].value = staticParams.size;

    rgbPass.uniforms[ 'angle' ].value = rgbParams.angle*Math.PI;
    rgbPass.uniforms[ 'amount' ].value = rgbParams.amount;

    filmPass.uniforms[ 'sCount' ].value = filmParams.count;
    filmPass.uniforms[ 'sIntensity' ].value = filmParams.sIntensity;
    filmPass.uniforms[ 'nIntensity' ].value = filmParams.nIntensity;
}

function randomRoll() {
    badTVParams.rollSpeed = Math.random() + 1;
    onParamsChange();
    setTimeout(function() {
        badTVParams.rollSpeed = 0;
        onParamsChange();
        setTimeout(randomRoll, (Math.random() * 40000) + 30000);
    }, 250);
}

function randomDistort2() {
    badTVParams.distortion = Math.random()*10+1;
    badTVParams.distortion2 = Math.random()*10+2;
    onParamsChange();
    setTimeout(randomDistort2, (Math.random() * 30000) + 30000);
}

function revertDist() {
    var startDist = 0.4;
    var startDist2 = 0.6;
    badTVParams.distortion += (startDist - badTVParams.distortion) / 5;
    badTVParams.distortion2 += (startDist2 - badTVParams.distortion2) / 5;
    onParamsChange();
}


function randomizeParams() {

    if (Math.random() <0.2){
        //you fixed it!
        badTVParams.distortion = 0.1;
        badTVParams.distortion2 =0.1;
        badTVParams.speed =0;
        badTVParams.rollSpeed =0;
        rgbParams.angle = 0;
        rgbParams.amount = 0;
        staticParams.amount = 0;

    }else{
        badTVParams.distortion = Math.random()*10+0.1;
        badTVParams.distortion2 = Math.random()*10+0.1;
        badTVParams.speed = Math.random()*0.4;
        badTVParams.rollSpeed = Math.random()*0.2;
        rgbParams.angle = Math.random()*2;
        rgbParams.amount = Math.random()*0.03;
        staticParams.amount = Math.random()*0.2;
    }

    onParamsChange();
}

function onToggleMute(){
    video.volume  = badTVParams.mute ? 0 : 1;
}

function onToggleShaders(){

    //Add Shader Passes to Composer
    //order is important
    composer = new THREE.EffectComposer( renderer);
    composer.addPass( renderPass );

    if (filmParams.show){
        composer.addPass( filmPass );
    }

    if (badTVParams.show){
        composer.addPass( badTVPass );
    }

    if (rgbParams.show){
        composer.addPass( rgbPass );
    }

    //if (staticParams.show){
    //    composer.addPass( staticPass );
    //}

    composer.addPass( copyPass );
    copyPass.renderToScreen = true;
}

function animate() {

    shaderTime += 0.1;
    badTVPass.uniforms[ 'time' ].value =  shaderTime;
    filmPass.uniforms[ 'time' ].value =  shaderTime;
    staticPass.uniforms[ 'time' ].value =  shaderTime;

    //if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
    //    if ( videoTexture ) videoTexture.needsUpdate = true;
    //}

    requestAnimationFrame( animate );
    composer.render( 0.1);
    //stats.update();
}

function onResize() {
    var possibleHeight = window.innerWidth * (3 / 4);
    var possibleWidth = window.innerHeight * (4 / 3);
    var finalWidth = window.innerWidth;
    var finalHeight = window.innerHeight;
    if(possibleWidth <= window.innerWidth) {
        finalWidth = possibleWidth;
    } else {
        finalHeight = possibleHeight;
    }

    if (usingWebGl) {       
        filmParams.count = finalHeight * 2;
        plane.scale.x = (finalWidth / 100);// * (window.screen.height / window.innerHeight);
        plane.scale.y = (finalHeight / 100);// * (window.screen.height / window.innerHeight);
        renderer.setSize(finalWidth, finalHeight);
        camera.aspect = finalWidth / finalHeight;
        camera.position.z = finalHeight;
        camera.updateProjectionMatrix();
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.left = ((window.innerWidth - finalWidth) / 2) + 'px';
        renderer.domElement.style.top = ((window.innerHeight - finalHeight) / 2) + 'px';
        onParamsChange();
    } else {
        document.getElementById('stage').style.width = finalWidth + 'px';
        document.getElementById('stage').style.height = finalHeight + 'px';
        document.getElementById('stage').style.marginLeft = ((window.innerWidth - finalWidth) / 2) + 'px';
        document.getElementById('stage').style.marginTop = ((window.innerHeight - finalHeight) / 2) + 'px';
    }

    var mainLogo = document.getElementById("mainLogo");
    mainLogo.style.top = ((((window.innerHeight - finalHeight) / 2) + finalHeight) - 20) + "px";
    mainLogo.style.left = ((((window.innerWidth - finalWidth) / 2) + finalWidth) - 158) + "px";

}

var lat = 51.435198;
var lng = 0.36597;
var user_lat = lat;
var user_lng = lng;
var displayLogo = true;
//var dist = 0.003706;
var fontWidth = 10;
var fontHeight = 18;
//var cols = 80;
//var rows = 25;
var startedWebgl = false;
//var consoleDiv = document.createElement('div');
//consoleDiv.className = "console";
//document.body.appendChild(consoleDiv);
//var consoleImg = document.getElementById('consoleImg');
//consoleImg.className = 'consoleimg';
//document.body.appendChild(consoleImg);

//function windowResize() {
//    if(window.innerWidth < window.innerHeight) {
//        cols = 60;
//    } else {
//        cols = 80;
//    }
//    rows = Math.round((cols / window.innerWidth) * (window.innerHeight * (fontWidth / fontHeight)));
//    getMap();
//}

//window.addEventListener("resize", windowResize);

document.querySelector('body').addEventListener("click", function (e) {
    if (displayLogo) {
        displayLogo = false;
        getMap();
    } else {
        //console.log(e);
        if (e.clientX < window.innerWidth / 6) {
            lng -= dist / 2;
            getMap();
        }
        else if (e.clientX > window.innerWidth - (window.innerWidth / 6)) {
            lng += dist / 2;
            getMap();
        }
        else if (e.clientY < window.innerHeight / 6) {
            lat += dist / 4;
            getMap();
        }
        else if (e.clientY > window.innerHeight - (window.innerHeight / 6)) {
            lat -= dist / 4;
            getMap();
        }
    }
});