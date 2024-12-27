const SCALE = 1.0; // The scale should be adjusted dinamically based on the video resolution (scale 1 = 900x600px)
const FRICTION = 0.99;
const SUBSTEP = 5;
const GRAVITY = 0.25;
const BALL_AMOUNT = 1;
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

let areaWidth = 900;
let areaHeight = 600;

let ballArray = [];
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
let customFont = null;

let gameStart = false;

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(areaWidth, areaHeight);

  // Create the video and hide it
  video = createCapture(VIDEO, { flipped: true });
  video.size(areaWidth, areaHeight);
  video.hide();

  // Start detecting poses in the webcam video
  bodyPose.detectStart(video, gotPoses);

  // Get the skeleton connection information
  connections = bodyPose.getSkeleton();

  // Create body action balls
  player1LeftHandActionBall = new ball(10, 10, ACTION_BALL_RADIUS, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  player1RightHandActionBall = new ball(10, 10, ACTION_BALL_RADIUS, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  ballArray.push(player1LeftHandActionBall);
  ballArray.push(player1RightHandActionBall);
  player2LeftHandActionBall = new ball(10, 10, ACTION_BALL_RADIUS, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  player2RightHandActionBall = new ball(10, 10, ACTION_BALL_RADIUS, color(0, 255, 0, 50), BallType.BODY_ACTION_BALL);
  ballArray.push(player2LeftHandActionBall);
  ballArray.push(player2RightHandActionBall);

  // Create sticky balls
  stickyBall1 = new ball(400, 190, 10, color(0, 255, 255, 80), BallType.STICKY_BALL);
  stickyBall2 = new ball(500, 190, 10, color(0, 255, 255, 80), BallType.STICKY_BALL);
  stickyBall3 = new ball(425, 245, 10, color(0, 255, 255, 80), BallType.STICKY_BALL);
  stickyBall4 = new ball(475, 245, 10, color(0, 255, 255, 80), BallType.STICKY_BALL);
  scoreBall = new ball(450, 235, 10, color(0, 255, 255, 80), BallType.SCORE_BALL);
  ballArray.push(stickyBall1);
  ballArray.push(stickyBall2);
  ballArray.push(stickyBall3);
  ballArray.push(stickyBall4);
  ballArray.push(scoreBall);

  // Load resources
  heartImage = loadImage('heart.png');
  basketballImage = loadImage('basketball.png');
  silhouetteImage = loadImage('silhouette.png');
  basketImage = loadImage('basket.png');
  basketPlatformImage = loadImage('basket_platform.png');
  floorImage = loadImage('ground.png');
  customFont = loadFont('PressStart2P.ttf');
  textFont(customFont);

  frameRate(60);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

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
        strokeWeight(2);
        line(areaWidth - pointA.x, pointA.y, areaWidth - pointB.x, pointB.y);
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
        circle(areaWidth - keypoint.x, keypoint.y, 10);
      }
    }
  }

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

  // Draw background basket platform
  image(basketPlatformImage, areaWidth/2 - BASKET_WIDTH/2, BASKET_HEIGHT/4, BASKET_WIDTH, BASKET_HEIGHT);

  // Create new basketballs
  if (ballArray.length < BALL_AMOUNT + 2 + 2 + 5) {
    let randomHorPosition = random(1) >= 0.5 ? random(areaWidth/2 - BASKET_WIDTH/2) : random(areaWidth/2 + BASKET_WIDTH/2, areaWidth);
    ballArray.push(new ball(randomHorPosition, random(100) - 150, 30, color(255, 0, 0), BallType.BASKET_BALL));
  }

  // Update balls states
  for (let i = 0; i < SUBSTEP; i++) {
    communicateBetweenBalls();
    ballArray.forEach((ball) => ball.update());
    ballArray.forEach((ball) => ball.resolveAreaEdges(areaWidth, areaHeight));
  }

  // Draw floor
  image(floorImage, 0, areaHeight - FLOOR_IMAGE_HEIGHT, FLOOR_IMAGE_WIDTH, FLOOR_IMAGE_HEIGHT);

  // Draw balls
  ballArray.forEach((ball) => ball.draw());

  // Draw players data
  drawPlayersData();

  if (!gameStart) {
    drawPlayersSilhouettes();
  }

  // Draw foreground basket
  image(basketImage, areaWidth/2 - BASKET_WIDTH/2, BASKET_HEIGHT/4, BASKET_WIDTH, BASKET_HEIGHT);

  // Delete balls marked for deletion
  for (let i = ballArray.length - 1; i >= 0; i--) {
    if (ballArray[i].markToDelete) {
      ballArray.splice(i, 1);
    }
  }
}

function updateHandActionBall(pose, elbow, wrist, actionBall) {
  if (pose[wrist].confidence > 0.1) {
    let hand_coord = getHandCoordinateFromElbowAndWrist(pose[elbow], pose[wrist], 0.2);
    actionBall.pos.x = areaWidth - hand_coord.x;
    actionBall.pos.y = hand_coord.y;
  }
}

function drawPlayersSilhouettes() {
  image(silhouetteImage, areaWidth/4 - SILHOUETTE_WIDTH/2, areaHeight - areaHeight/2 + areaHeight/10 - SILHOUETTE_HEIGHT/2, SILHOUETTE_WIDTH, SILHOUETTE_HEIGHT); // Player 1
  image(silhouetteImage, areaWidth - areaWidth/4 - SILHOUETTE_WIDTH/2, areaHeight - areaHeight/2 + areaHeight/10 - SILHOUETTE_HEIGHT/2, SILHOUETTE_WIDTH, SILHOUETTE_HEIGHT); // Player 2
}

function drawPlayersData() {
  fill(255);
  stroke(0);
  strokeWeight(4);
  textSize(16);
  textAlign(LEFT, CENTER);
  text('Player 1 / ' + player1Score + ' Pts.', 10, 22);
  for (let i = 0; i < player1Lives; i++) {
    image(heartImage, 10 + i * (24 + 5), 10 + 22 + 10, 24, 24);
  }

  text('Player 2 / ' + player2Score + ' Pts.', areaWidth/2 + 110, 22);
  for (let i = 0; i < player2Lives; i++) {
    image(heartImage, areaWidth/2 + 110 + i * (24 + 5), 10 + 22 + 10, 24, 24);
  }
}

function getHandCoordinateFromElbowAndWrist(elbow, wrist, percentage) {
    let new_x = wrist.x + percentage * (wrist.x - elbow.x);
    let new_y = wrist.y + percentage * (wrist.y - elbow.y);
    return createVector(new_x, new_y);
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
    this.radius = radius == null ? random(MIN_RADIUS, MAX_RADIUS) : radius;
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
            } else if (target.lastPlayerWhoTouched == 2) {
              player2Score ++;
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
        }
        else if (this.pos.x > areaWidth/2 && this.pos.x < areaWidth) {
          player2Lives--;
        }
        this.markToDelete = true;
      }
    };

};