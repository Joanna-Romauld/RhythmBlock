
let sampler;
let kick;
let snare;
let beatLoop;
let beatStarted = false;

let blocks = [];
const blockSize = 125;
let blockSpeed = 1.5;
const numBlocks = 6;
let gameStarted = false;
let gameOver = false;
let popEffects = [];

let score = 0;

 
const blockKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let keyToChord = {};


sampler = new Tone.Sampler({
    urls: {
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3"
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
  }).toDestination();

  const chordPool = [
  ["C4", "E4", "G4"],
  ["D4", "F4", "A4"],
  ["E4", "G4", "B4"],
  ["F4", "A4", "C5"],
  ["G4", "B4", "D5"],
  ["A4", "C5", "E5"],
  ["B3", "D4", "F#4"],
  ];

  const hihat = new Tone.MetalSynth({
    frequency: 400,
    envelope: {
      attack: .001,
      decay: .1,
      release: .01
    },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5

  }).toDestination();

  function setupChordMap() {
    let keys = blockKeys;
    keys.forEach(k => {
      keyToChord[k] = random(chordPool);
    });
  }

  function createBeatLoop() {
    let step = 0;
    beatLoop = new Tone.Loop((time) => {
      if(step % 2 === 0){
          kick.triggerAttackRelease("C1", "8n", time);
      }
      if(step % 1 === 0) {
          hihat.triggerAttackRelease("16n", time);
      }
      else {
        snare.triggerAttackRelease("8n", time);
      }
      
    }, "4n");
  }

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  
  cnv.parent(document.body);
  setupChordMap();
  Tone.Transport.bpm.value = 160;
  createBeatLoop();
 

  kick = new Tone.MembraneSynth().toDestination();
  snare = new Tone.NoiseSynth({
    noise: { type: 'white'},
    envelope: { attack: .01, decay: .1, sustain: 0}
  }).toDestination();


}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();

  if (gameOver) {
    textAlign(CENTER, CENTER);
text("GAME OVER", width / 2, height / 4);
  textSize(40);
  return;
  }
  if (!gameStarted) return;
  
  stroke("red");
  strokeWeight(4);
  line(0, height - 400, width, height - 400);

  textAlign(CENTER, CENTER);
  textSize(32);

  for(let block of blocks){
  stroke("blue");
  strokeWeight(3);
  fill("purple");
  rect(block.x, block.y, block.size, block.size, 15);

  noStroke();
  fill("white");
  text(block.key, block.x + block.size / 2, block.y + block.size / 2);
  block.y += block.speed; // move the block down

   if (block.y + block.size> height){
    endGame();
    return;
  }
  }

  
  if(gameStarted && !gameOver){
fill("white")
  textAlign(RIGHT, TOP);
  text("Score: " + score, width - 200, 30);
  textSize(40);
  }

  CreatePopEffects();
}

function startGame() {
  Tone.start().then(() => {
    console.log("Audio started");

    const button = document.querySelector(".start-button");
    button.classList.add("hidden");
    setTimeout(() => button.style.display = "none", 500);

    gameOver = false;
    gameStarted = true;
    initGame();
  }  );
}

function endGame() {
  gameStarted = false;
  gameOver = true;
  blocks = [];

  beatLoop.stop();
  Tone.Transport.stop();
  beatStarted = false;

  const button = document.querySelector(".start-button");
  button.classList.remove("hidden");
  button.style.display = "block";
}

function initGame() {
    let existingXs = [];
  for(let i = 0; i < numBlocks; i++)
  {
    let x;
    let tries = 0;

    do {
      x = random(0, width - blockSize);
      tries++;
    }
    while (!isFarEnough(x, existingXs, blockSize + 100) && tries < 50);
    existingXs.push(x);

    const randomIndex = floor(random(blockKeys.length));
    const randomKey = blockKeys[randomIndex];
    blocks.push({
      x: x,
      y: -i * (blockSize + 200),
      size: blockSize,
      speed: blockSpeed,
      key: randomKey
    })
  }
  
}

function keyPressed() {
  if (!gameStarted) return;
  const pressedKey = key.toUpperCase();

  for(let i = 0; i < blocks.length; i++){
    let block = blocks[i];

  if (block.key === pressedKey && block.y > height - block.size - 400) {
    
    if(!beatStarted) {
        Tone.start();
        Tone.Transport.start();
        beatLoop.start(0);
        beatStarted = true;
    }

    const chord = keyToChord[pressedKey];
    if(chord) {
      block
      chord.forEach((note, i) => {
      sampler.triggerAttackRelease(note, "4n", "+0." + i);
      });

      score++;
      blockSpeed += .03;
      blocks.forEach(b => b.speed = blockSpeed);

    
    }

    popEffects.push({ x: block.x + block.size / 2, y: block.y + block.size / 2, size: 30, alpha: 255 });
    resetBlock(block);
    break;
  }
}

}

function resetBlock(block) {
  let x;
  let tries = 0;

  do {
      x = random(0, width - blockSize);
      tries++;
    } while (!isFarEnough(x, blocks.map(b => b.x), blockSize + 10) && tries < 50);
    block.y = -block.size; // reset the block to above the canvas
    block.x = x; // randomize the x position

    const randomIndex = floor(random(blockKeys.length));
    block.key = blockKeys[randomIndex];

}

function isFarEnough(x, existingXs, minDistance) {
  for (let existingX of existingXs) {
    if (abs(existingX - x) < minDistance) {
      return false; // too close
    }
  }
  return true; // far enough

}

function CreatePopEffects() {
  for (let i = popEffects.length-1; i >= 0; i--)
    {
      const p = popEffects[i];
      noFill();
      stroke("purple");
      stroke(255, 100, 200, p.alpha);
      strokeWeight(4);
      ellipse(p.x, p.y, p.size);
      p.size += 5;
      p.alpha -= 10;
      if (p.alpha <= 0) {
        popEffects.splice(i, 1); // remove the effect
      }
    }
}