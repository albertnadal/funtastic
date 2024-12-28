const INITIAL_SCALE = 1.0; // The scale should be adjusted dinamically based on the video resolution (scale 1 = 900x600px)
const DEBUG = false;
const FRICTION = 0.99;
const SUBSTEP = 5;
const GRAVITY = 0.25;
const INITIAL_BALL_AMOUNT = 1;
const MIN_RADIUS = 15;
const MAX_RADIUS = 30;
const SPEED_LIMIT = 5;
const FORCE_MULTIPLIER = 100;
const ACTION_BALL_RADIUS = 60;
const MAX_LIVES = 10;
const SILHOUETTE_WIDTH = 190;
const SILHOUETTE_HEIGHT = 440;
const BASKET_WIDTH = 230;
const BASKET_HEIGHT = 215;
const FLOOR_IMAGE_HEIGHT = 54;
const FLOOR_IMAGE_WIDTH = 900;
const LOGO_WIDTH = 600;
const LOGO_HEIGHT = 600;

const GameState = {
  WELCOME: 'WELCOME',
  PLAYERS_TAKE_POSITIONS: 'PLAYERS_TAKE_POSITIONS',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

const BallType = {
  BASKET_BALL: 'BASKET_BALL',
  BODY_ACTION_BALL: 'BODY_ACTION_BALL',
  STICKY_BALL: 'STICKY_BALL',
  SCORE_BALL: 'SCORE_BALL'
};

let video;
let bodyPose;
let poses = [];
let connections;

let scale = INITIAL_SCALE;
let areaWidth = 900;
let areaHeight = 600;

let ballArray = [];
let ballAmount = 0;
let player1LeftHandActionBall = null;
let player1RightHandActionBall = null;
let player2LeftHandActionBall = null;
let player2RightHandActionBall = null;
let stickyBall1 = null;
let stickyBall2 = null;
let stickyBall3 = null;
let stickyBall4 = null;
let scoreBall = null;

let player1Score = 0;
let player2Score = 0;
let player1Lives = MAX_LIVES;
let player2Lives = MAX_LIVES;
let heartImage = null;
let basketballImage = null;
let silhouetteImage = null;
let basketPlatformImage = null;
let basketImage = null;
let floorImage = null;
let logoImage = null;
let customFont = null;
let music = null;
let countdownAudio = null;
let playersTakePositionsAudio = null;
let celebrationAudio = null;
let missedBallAudio = null;
let audioContext = null;
let countdown = 3;
let countdownLastTime = 0;
let ballAmountIncrementalLastTime = 0;
let currentState = GameState.WELCOME;

const speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose();

  // Load resources
  heartImage = loadImage('heart.png');
  basketballImage = loadImage('basketball.png');
  silhouetteImage = loadImage('silhouette.png');
  basketImage = loadImage('basket.png');
  basketPlatformImage = loadImage('basket_platform.png');
  floorImage = loadImage('ground.png');
  logoImage = loadImage('funtastic.png');
  customFont = loadFont('PressStart2P.ttf');

  // Load audio resources
  audioContext = new AudioContext();
  music = new Audio('music.mp3');
  music.volume = 0.2;
  music.mozPreservesPitch = false;
  music.preservesPitch = false;
  countdownAudio = new Audio('countdown.mp3');
  countdownAudio.mozPreservesPitch = false;
  countdownAudio.preservesPitch = false;
  playersTakePositionsAudio = new Audio('nba_sound.mp3');
  playersTakePositionsAudio.volume = 0.2;
  playersTakePositionsAudio.mozPreservesPitch = false;
  playersTakePositionsAudio.preservesPitch = false;
  celebrationAudio = new Audio('celebration.mp3');
  celebrationAudio.mozPreservesPitch = false;
  celebrationAudio.preservesPitch = false;
  missedBallAudio = new Audio('missed_ball.mp3');
  missedBallAudio.volume = 1.0;
  missedBallAudio.mozPreservesPitch = false;
  missedBallAudio.preservesPitch = false;

  // Start voice recognition
  initVoiceRecognition();
}

function setup() {
  scale = windowHeight * INITIAL_SCALE / areaHeight;
  createCanvas(areaWidth * scale, areaHeight * scale);

  // Create the video and hide it
  video = createCapture(VIDEO, { flipped: true });
  video.size(areaWidth * scale, areaHeight * scale);
  video.hide();

  // Start detecting poses in the webcam video
  bodyPose.detectStart(video, gotPoses);

  // Get the skeleton connection information
  connections = bodyPose.getSkeleton();

  // Create body action balls
  player1LeftHandActionBall = new ball(10 * scale, 10 * scale, ACTION_BALL_RADIUS * scale, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  player1RightHandActionBall = new ball(10 * scale, 10 * scale, ACTION_BALL_RADIUS * scale, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  ballArray.push(player1LeftHandActionBall);
  ballArray.push(player1RightHandActionBall);
  player2LeftHandActionBall = new ball(10 * scale, 10 * scale, ACTION_BALL_RADIUS * scale, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  player2RightHandActionBall = new ball(10 * scale, 10 * scale, ACTION_BALL_RADIUS * scale, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  ballArray.push(player2LeftHandActionBall);
  ballArray.push(player2RightHandActionBall);

  // Create sticky balls
  stickyBall1 = new ball(400 * scale, 190 * scale, 10 * scale, color(0, 255, 255, DEBUG ? 100 : 0), BallType.STICKY_BALL);
  stickyBall2 = new ball(500 * scale, 190 * scale, 10 * scale, color(0, 255, 255, DEBUG ? 100 : 0), BallType.STICKY_BALL);
  stickyBall3 = new ball(425 * scale, 245 * scale, 10 * scale, color(0, 255, 255, DEBUG ? 100 : 0), BallType.STICKY_BALL);
  stickyBall4 = new ball(475 * scale, 245 * scale, 10 * scale, color(0, 255, 255, DEBUG ? 100 : 0), BallType.STICKY_BALL);
  scoreBall = new ball(450 * scale, 235 * scale, 10 * scale, color(0, 255, 255, DEBUG ? 100 : 0), BallType.SCORE_BALL);
  ballArray.push(stickyBall1);
  ballArray.push(stickyBall2);
  ballArray.push(stickyBall3);
  ballArray.push(stickyBall4);
  ballArray.push(scoreBall);

  textFont(customFont);

  frameRate(60);
}

function initVoiceRecognition() {
  if (speechRecognition) {
    const recognition = new speechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let spokenWord = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log(spokenWord);

      if ((spokenWord === "play") && (currentState == GameState.WELCOME)) {
        currentState = GameState.PLAYERS_TAKE_POSITIONS;
        audioContext.resume().then(() => {
          playersTakePositionsAudio.currentTime = 0;
          playersTakePositionsAudio.play();
        });
      } else if (((spokenWord === "go") || (spokenWord === "go go")) && (currentState == GameState.PLAYERS_TAKE_POSITIONS)) {
        playersTakePositionsAudio.pause();
        player1Score = 0;
        player2Score = 0;
        player1Lives = MAX_LIVES;
        player2Lives = MAX_LIVES;
        ballAmount = 0;
        countdown = 3;
        countdownLastTime = 0;
        currentState = GameState.COUNTDOWN;
        audioContext.resume().then(() => {
          countdownAudio.currentTime = 0;
          countdownAudio.play();
        });
      } else if ((spokenWord === "ball") && (currentState == GameState.PLAYING)) {
        ballAmount ++;
      }
    };

    recognition.onerror = (event) => { };

    recognition.onend = () => {
      recognition.start();
    };

    recognition.start();
  } else {
    console.log("API de reconeixement de veu no suportada en aquest navegador.");
  }
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  if(currentState == GameState.WELCOME) {
    let size = (LOGO_WIDTH + sin(frameCount * 0.1) * LOGO_WIDTH * 0.2) * scale;
    push();
    imageMode(CENTER);
    image(logoImage, (areaWidth / 2) * scale, (areaHeight / 2) * scale, size, size);
    pop();

    drawSayPlayText();
  }

  if([GameState.PLAYERS_TAKE_POSITIONS, GameState.COUNTDOWN, GameState.PLAYING].includes(currentState)) {

    if(DEBUG) {
      drawBodyPoseSkeletons();
    }

    // Calculate the position of players hand action balls
    calculatePlayersHandsPositions();

    // Draw background basket platform
    image(basketPlatformImage, (areaWidth/2 - BASKET_WIDTH/2) * scale, (BASKET_HEIGHT/4) * scale, BASKET_WIDTH * scale, BASKET_HEIGHT * scale);
  }

  // Create new basketballs
  if (ballArray.length < ballAmount + 2 + 2 + 5) {
    let randomHorPosition = random(1) >= 0.5 ? random(areaWidth/2 - BASKET_WIDTH/2) : random(areaWidth/2 + BASKET_WIDTH/2, areaWidth);
    ballArray.push(new ball(randomHorPosition * scale, (random(100) - 150) * scale, 30 * scale, color(255, 0, 0), BallType.BASKET_BALL));
  }

  // Update balls states
  for (let i = 0; i < SUBSTEP; i++) {
    communicateBetweenBalls();
    ballArray.forEach((ball) => ball.update());
    ballArray.forEach((ball) => ball.resolveAreaEdges(areaWidth * scale, areaHeight * scale));
  }

  if([GameState.PLAYERS_TAKE_POSITIONS, GameState.COUNTDOWN, GameState.PLAYING].includes(currentState)) {
    // Draw floor
    image(floorImage, 0, (areaHeight - FLOOR_IMAGE_HEIGHT) * scale, FLOOR_IMAGE_WIDTH * scale, FLOOR_IMAGE_HEIGHT * scale);

    // Draw balls
    ballArray.forEach((ball) => ball.draw());
  }

  if([GameState.PLAYERS_TAKE_POSITIONS, GameState.COUNTDOWN, GameState.PLAYING].includes(currentState)) {
    // Draw players data
    drawPlayersData();
  }

  if(currentState == GameState.PLAYERS_TAKE_POSITIONS) {
    drawPlayersSilhouettes();
    drawPlayersTakeYourPositionsText();
  }

  if(currentState == GameState.COUNTDOWN) {
    updateCountdown();
  }

  if(currentState == GameState.PLAYING) {
    // Draw foreground basket
    image(basketImage, (areaWidth/2 - BASKET_WIDTH/2) * scale, (BASKET_HEIGHT/4) * scale, BASKET_WIDTH * scale, BASKET_HEIGHT * scale);

    // Add a new ball every 60 seconds
    addNewBallIncrementally();

    // Delete balls marked for deletion
    for (let i = ballArray.length - 1; i >= 0; i--) {
      if (ballArray[i].markToDelete) {
        ballArray.splice(i, 1);
      }
    }
  }

}

function calculatePlayersHandsPositions() {
  // Calculate the position of player 1 action balls based on the left and right hand positions
  if (poses.length > 0) {
    updateHandActionBall(poses[0], 'left_elbow', 'left_wrist', player1LeftHandActionBall);
    updateHandActionBall(poses[0], 'right_elbow', 'right_wrist', player1RightHandActionBall);
  }

  // Calculate the position of player 2 action balls based on the left and right hand positions
  if (poses.length > 1) {
    updateHandActionBall(poses[1], 'left_elbow', 'left_wrist', player2LeftHandActionBall);
    updateHandActionBall(poses[1], 'right_elbow', 'right_wrist', player2RightHandActionBall);
  }
}

function updateHandActionBall(pose, elbow, wrist, actionBall) {
  if (pose[wrist].confidence > 0.1) {
    let hand_coord = getHandCoordinateFromElbowAndWrist(pose[elbow], pose[wrist], 0.2);
    actionBall.pos.x = areaWidth * scale - hand_coord.x;
    actionBall.pos.y = hand_coord.y;
  }
}

function getHandCoordinateFromElbowAndWrist(elbow, wrist, percentage) {
  let new_x = wrist.x + percentage * (wrist.x - elbow.x);
  let new_y = wrist.y + percentage * (wrist.y - elbow.y);
  return createVector(new_x, new_y);
}

function updateCountdown() {
  if (countdownLastTime == 0) {
    countdownLastTime = millis();
  }

  fill(255);
  stroke(0);
  strokeWeight(4 * scale);
  textSize(100 * scale);
  textAlign(CENTER, CENTER);
  text(countdown > 0 ? countdown : "Go!", (areaWidth/2) * scale, (areaHeight/2) * scale);

  if (millis() - countdownLastTime > 1000) {
    countdown--;
    countdownLastTime = millis();
    if (countdown == 0) {
      music.loop = true;
      audioContext.resume().then(() => {
        music.currentTime = 0;
        music.play();
      });
    }

    if (countdown < -1) {
      currentState = GameState.PLAYING;
      ballAmount = INITIAL_BALL_AMOUNT;
    }
  }
}

function addNewBallIncrementally() {
  if (millis() - ballAmountIncrementalLastTime >= 60000) {
    ballAmountIncrementalLastTime = millis();
    ballAmount++;
  }
}

function drawBodyPoseSkeletons() {
  // Draw the skeleton connections
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = pose.keypoints[pointAIndex];
      let pointB = pose.keypoints[pointBIndex];
      // Only draw a line if both points are confident enough
      if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
        stroke(255, 0, 0);
        strokeWeight(2 * scale);
        line((areaWidth * scale - pointA.x), pointA.y, (areaWidth * scale - pointB.x), pointB.y);
      }
    }
  }

  // Draw all the tracked landmark points
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      // Only draw a circle if the keypoint's confidence is bigger than 0.1
      if (keypoint.confidence > 0.1) {
        fill(0, 255, 0);
        noStroke();
        circle((areaWidth * scale - keypoint.x), keypoint.y, 10);
      }
    }
  }
}

function drawPlayersSilhouettes() {
  image(silhouetteImage, (areaWidth/4 - SILHOUETTE_WIDTH/2) * scale, (areaHeight - areaHeight/2 + areaHeight/10 - SILHOUETTE_HEIGHT/2) * scale, SILHOUETTE_WIDTH * scale, SILHOUETTE_HEIGHT * scale); // Player 1
  image(silhouetteImage, (areaWidth - areaWidth/4 - SILHOUETTE_WIDTH/2) * scale, (areaHeight - areaHeight/2 + areaHeight/10 - SILHOUETTE_HEIGHT/2) * scale, SILHOUETTE_WIDTH * scale, SILHOUETTE_HEIGHT * scale); // Player 2
}

function drawPlayersData() {
  fill(255);
  stroke(0);
  strokeWeight(4 * scale);
  textSize(16 * scale);
  textAlign(LEFT, CENTER);
  text('Player 1 / ' + player1Score + ' Pts.', 10 * scale, 22 * scale);
  for (let i = 0; i < player1Lives; i++) {
    image(heartImage, (10 + i * (24 + 5)) * scale, (10 + 22 + 10) * scale, 24 * scale, 24 * scale);
  }

  text('Player 2 / ' + player2Score + ' Pts.', (areaWidth/2 + 110) * scale, 22 * scale);
  for (let i = 0; i < player2Lives; i++) {
    image(heartImage, (areaWidth/2 + 110 + i * (24 + 5)) * scale, (10 + 22 + 10) * scale, 24 * scale, 24 * scale);
  }
}

function drawSayPlayText() {
  fill(255);
  stroke(0);
  strokeWeight(4 * scale);
  textSize(20 * scale);
  textAlign(CENTER, CENTER);
  text('Say "play" to play a new game.', (areaWidth/2) * scale, (areaHeight - areaHeight/5) * scale);
}

function drawPlayersTakeYourPositionsText() {
  fill(255);
  stroke(0);
  strokeWeight(4 * scale);
  textSize(22 * scale);
  textAlign(CENTER, CENTER);
  text('Players, take your positions!\n\nSay "go" to start the game.', (areaWidth/2) * scale, (areaHeight - areaHeight/5) * scale);
}

function playScoreCelebrationAudio() {
  celebrationAudio.currentTime = 0;
  celebrationAudio.play();
}

function playMissedBallAudio() {
  missedBallAudio.currentTime = 0;
  missedBallAudio.play();
}

// Callback function for when bodyPose outputs data
function gotPoses(results) {
  // Save the output to the poses variable
  poses = results;
}

function communicateBetweenBalls() {
  for (let i = 0; i < ballArray.length; i++) {
    const current = ballArray[i];
    const rest = ballArray.slice(i + 1);
    for (const target of rest) {
      current.checkCollision(target);
    }
  }
}

const ball = function (x, y, radius = null, color_ = null, ballType_ = BallType.BASKET_BALL, image_ = null) {
    this.pos = createVector(x, y);
    this.vel = createVector(1, 0).rotate(random(PI));
    this.acc = createVector(0, 0);
    this.radius = radius == null ? random(MIN_RADIUS, MAX_RADIUS) * scale : radius;
    this.diameter = this.radius * 2;
    this.mass = this.radius ** 2;
    this.color = color_ == null ? color(random(256), random(256), random(256)) : color_;
    this.ballType = ballType_;
    this.image = image_;
    this.rotation = random(360);
    this.markedToDelete = false;
    this.lastPlayerWhoTouched = null;
  
    this.checkCollision = function (target) {
      const difference = this.pos.copy().sub(target.pos);
      const distance = difference.mag();
      const totalRadius = this.radius + target.radius;

      if (distance < totalRadius) {
        const nonZeroDistance = max(distance, 0.1);
        const overlapRatio = totalRadius / nonZeroDistance - 1;
        const force = difference
          .normalize()
          .mult(overlapRatio)
          .mult(FORCE_MULTIPLIER);
        const totalMass = this.mass + target.mass;
        const shareA = target.mass / totalMass;
        const shareB = this.mass / totalMass;

        if (this.ballType == BallType.BASKET_BALL) {
            this.acc.add(force.copy().mult(shareA));
        }

        if (target.ballType == BallType.BASKET_BALL) {
          target.acc.sub(force.copy().mult(shareB));

          if (this == player1LeftHandActionBall || this == player1RightHandActionBall) {
            target.lastPlayerWhoTouched = 1;
          } else if (this == player2LeftHandActionBall || this == player2RightHandActionBall) {
            target.lastPlayerWhoTouched = 2;
          } else if (this == scoreBall && !target.markToDelete) {
            if (target.lastPlayerWhoTouched == 1) {
              player1Score ++;
              playScoreCelebrationAudio();
            } else if (target.lastPlayerWhoTouched == 2) {
              player2Score ++;
              playScoreCelebrationAudio();
            }
            target.markToDelete = true;
          }
        }
      }
    };
  
    this.draw = function () {
      if (this.image) {
        push();
        translate(this.pos.x + this.diameter / 2, this.pos.y + this.diameter / 2);
        rotate(radians(this.rotation));
        imageMode(CENTER);
        image(this.image, 0, 0, this.diameter, this.diameter);
        pop();
      } else {
        noStroke();
        fill(this.color);
        ellipse(this.pos.x, this.pos.y, this.diameter);
      }
    };
  
    this.update = function () {
      if(this.ballType != BallType.BASKET_BALL) return;

      this.vel.add(this.acc.div(SUBSTEP));
      this.vel.limit(SPEED_LIMIT);
      this.pos.add(this.vel);

      this.acc.mult(0);
      this.acc.y = GRAVITY / SUBSTEP;
      this.vel.mult(FRICTION);

      // Rotate the ball based on its velocity
      this.rotation += (this.vel.x > 0 ? 1 : -1) * this.vel.mag() / 2;
    };
  
    this.resolveAreaEdges = function (areaWidth, areaHeight) {
      if(this.ballType != BallType.BASKET_BALL) return;

      // Check if the ball touches the left or right side of the screen
      if ((this.pos.x < -this.diameter) || (this.pos.x > areaWidth)) {
        this.markToDelete = true;
      }

      // Check if the ball touches the bottom of the screen
      if (!this.markToDelete && this.pos.y > areaHeight + this.diameter) {
        if (this.pos.x > 0 && this.pos.x <= areaWidth/2) {
          player1Lives--;
          playMissedBallAudio();
        }
        else if (this.pos.x > areaWidth/2 && this.pos.x < areaWidth) {
          player2Lives--;
          playMissedBallAudio();
        }
        this.markToDelete = true;
      }
    };

};