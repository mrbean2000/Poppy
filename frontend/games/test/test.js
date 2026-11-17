'use dom';
'use strict';

import * as LJS from 'littlejsengine';

import { useEffect, createRef } from 'react';

// You need to import your LittleJS game's main logic here.
// This example assumes you have a function that starts the game on a canvas.
// You might need to adapt this based on how you've structured your LittleJS code.
// For instance, if your game is in a separate JS file, you'd import it.
// import { startMyGame } from '../web-game/game.js';
let initialized = false;

export default function TestGame() {
  const canvasRef = createRef();

  useEffect(() => {
    // This is where you initialize and start your LittleJS engine.
    // The canvasRef.current gives you the canvas element to render onto.
    if (canvasRef.current) {


// show the LittleJS splash screen
LJS.setShowSplashScreen(true);
// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
LJS.setTileDefaultPadding(1);

// the level, one character a cell: # is a block, a space is empty
const levelMap = `
################################
#                              #
#                              #
#   #####            #####     #
#                              #
#                              #
#          ##########          #
#                              #
#                              #
#  ####                  ####  #
#                              #
#                              #
#        ####      ####        #
#                              #
#                              #
################################`;

// sound effects
const sound_click = new LJS.Sound([1,.5]);


// game variables
let particleEmitter;

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // create tile collision and visible tile layer from the level map
    const rows = levelMap.trim().split('\n');
    const levelSize = LJS.vec2(rows[0].length, rows.length);
    const tileLayer = new LJS.TileCollisionLayer(LJS.vec2(), levelSize);
    for (let x = levelSize.x; x--;)
    for (let y = levelSize.y; y--;)
    {
        // the first row of the map is the top of the level
        if (rows[levelSize.y - 1 - y][x] != '#')
            continue;

        // set tile data
        const pos = LJS.vec2(x, y);
        const tileIndex = 1;
        const direction = LJS.randInt(4);
        const mirror = LJS.randBool();
        const color = LJS.randColor();
        const data = new LJS.TileLayerData(tileIndex, direction, mirror, color);
        tileLayer.setData(pos, data);
        tileLayer.setCollisionData(pos);
    }

    // draw tile layer with new data
    tileLayer.redraw();

    // setup camera
    LJS.setCameraPos(LJS.vec2(16,8));
    LJS.setCameraScale(32);

    // enable gravity
    LJS.setGravity(LJS.vec2(0,-.01));

    // create a particle effect, built-in sparks twice the size, with some
    // of its settings replaced: more of them, bouncing off the tiles, and
    // carrying some of the emitter's motion as it follows the mouse
    particleEmitter = LJS.particleEffect('sparks', LJS.vec2(16,9), {scale: 2,
        emitRate: 500, particleTime: 1, collideLevel: true, restitution: .3,
        velocityInheritance: .3});
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    if (LJS.mouseWasPressed(0))
    {
        // play sound when mouse is pressed
        sound_click.play(LJS.mousePos);

        // change particle color and set to fade out
        particleEmitter.colorStartA = LJS.randColor();
        particleEmitter.colorStartB = LJS.randColor();
        particleEmitter.colorEndA = particleEmitter.colorStartA.scale(1,0);
        particleEmitter.colorEndB = particleEmitter.colorStartB.scale(1,0);
    }

    if (LJS.mouseWheel)
    {
        // zoom in and out with mouse wheel
        cameraScale -= sign(mouseWheel)*cameraScale/5;
        cameraScale = clamp(cameraScale, 10, 300);
    }

    // move particles to the mouse once it has moved
    if (LJS.mousePosScreen.x)
        particleEmitter.pos = LJS.mousePos.copy();
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // draw a gray square in the background, inside the walls
    LJS.drawRect(LJS.vec2(16,8), LJS.vec2(30,14), LJS.hsl(0,0,.6));

    // draw the logo as a tile, standing on the floor
    LJS.drawTile(LJS.vec2(26,3.25), LJS.vec2(4.5), LJS.tile(3,128));
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    LJS.drawTextScreen('LittleJS Demo', 
        LJS.vec2(LJS.mainCanvasSize.x/2, 70), 80,   // position, size
        LJS.hsl(0,0,1), 6, LJS.hsl(0,0,0));         // color, outline size and color
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
if (initialized == false)
{
    LJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);
    console.log('LittleJS canvas is ready.');
    initialized = true;
}

}
  }, [canvasRef]);

  return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
        />
  );
}