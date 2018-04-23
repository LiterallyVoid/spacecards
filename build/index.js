function addScore(s, x, y) {
    score += s;
    particles.push((function(t, time, x, y) {
	time = 0;
	x += random(-40, 40);
	y += random(-40, 40);
	function draw() {
	    push();

	    var l = pow(map(time, 0, 40, 0, 1), 12);
	    var l2 = map(time, 0, 40, 0, 0.5);
	    
	    translate(lerp(lerp(x, width * 0.5, l2), width - 20, l), lerp(lerp(y, height * 0.5, l2), 20, l));
	    textSize(40);
	    textAlign(CENTER, CENTER);

	    fill(255, map(time, 30, 50, 255, 0));
	    noStroke();
	    scale((1 - pow(map(time, 0, 40, 1, 0), 12)) * (1 - l));

	    text(t, 0, 0);
	    
	    pop();
	    if((time += timeSpeed) > 40) {
		return true;
	    }
	};
	return draw;
    })("+" + s, 0, x ,y));
};

function explosion(size, x, y) {
    for(var i = 0; i < size; i++) {
	particles.push((function(x, y) {
	    var xv = random(-4, 4);
	    var yv = random(-4, 4);
	    var time = 0;
	    function draw() {
		x += xv * timeSpeed;
		y += yv * timeSpeed;
		xv *= pow(0.9, timeSpeed);
		yv *= pow(0.9, timeSpeed);
		time += timeSpeed;
		noStroke();
		fill(64, 64, 64, constrain(map(time, 0, 60, 512, 0), 0, 64));
		ellipse(x, y, 30, 30);
		push();
		blendMode(ADD);
		noStroke();
		fill(255, 96, 0, map(time, 0, 60, 192, 0));
		ellipse(x, y, 30, 30);
		pop();
		return time > 60;
	    };
	    return draw;
	})(x, y));
    }
};
var mouseClick = false;

var trauma = 0;

var name = 'Spacecards';

var tutorial = [
    ['Controls', `You can use A/D or left/right arrows to play.
Hold space to continuously shoot bullets.

${name} is a shoot-em-up card game.
You can pick a card to play every few seconds.`],
    ['Cards', `Every turn, you have a deck of 5 cards.
You can either:
1) Use the top card, or
2) Discard the top card.

You can only see the top card.

Every card can have one of three qualities.

- Grey cards are common. They don't do much.
- Blue cards are rare.
- Gold cards are legendary. If you see one, take it!
  You aren't likely to find another one soon.`],
];


function createColor(r, g, b, a) {
    return [r, g, b, a];
};

var keys = [], keyRelease = [];

var grades = {
    COMMON: {
	chance: 6,
	color: createColor(255, 255, 255),
	name: "COMMON"
    },
    RARE: {
	chance: 3,
	color: createColor(0, 192, 255),
	name: "RARE",
    },
    LEGENDARY: {
	chance: 1,
	color: createColor(255, 192, 0),
	name: "LEGENDARY"
    },
};

var upgrades = {
    shield: 0,
    health: 1,
    refire: 1,
    speed: 1,
    bulletType: 1,
};

function resetUpgrades(){
    upgrades = {
	shield: 0,
	health: 1,
	refire: 1,
	speed: 1,
	bulletType: 1,
    };
};

function collideBullets(c, isEnemy, damageFunc) {
    for(var i = 0; i < bullets.length; i++) {
	if(bullets[i].collide(c, isEnemy)) {
	    bullets[i].doDamage(damageFunc);
	    if(bullets[i].t !== 3) {
		bullets.splice(i, 1);
	    }
	    i--;
	    continue;
	}
    }
};

var cardTypes = [
    {
	name: 'EMP',
	desc: 'Deal heavy to all ships on the battlefield.',
	grade: grades.LEGENDARY,
	use: function() {
	    trauma += 1;
	    for(var i = 0; i < enemies.length; i++) {
		enemies[i].health -= 50;
	    }
	    particles.push((function() {
		var time = 0;
		
		function draw() {
		    time++;

		    var d = time * 60;

		    var x = player.x, y = player.y;
		    
		    noFill();
		    stroke(0, 192, 255, 30);
		    strokeWeight(25);
		    ellipse(x, y, d, d);
		    strokeWeight(20);
		    ellipse(x, y, d, d);
		    strokeWeight(15);
		    ellipse(x, y, d, d);
		    strokeWeight(10);
		    ellipse(x, y, d, d);
		    stroke(0, 192, 255, 100);
		    strokeWeight(5);
		    ellipse(x, y, d, d);

		    for(var i = 0; i < random(-1, 1.2); i++) {
			var r = random(PI * 0.5, PI * 1.5);
			particles.push((function(x, y, xv, yv) {
			    var r = random(0, PI * 2);
			    var time = 0;
			    function draw() {
				x += xv;
				y += yv;
				xv *= 0.9;
				yv *= 0.9;
				var d = map(time, 0, 30, 30, 240);
				push();
				translate(x, y);
				rotate(r);
				noStroke();
				tint(255, map(time, 0, 30, 255, 0));
				image(images.particle, 0, 0, d, d);
				noTint();
				pop();
				time++;
				if(time >= 30) {
				    return true;
				}
			    };
			    return draw;
			})(sin(r) * d * 0.5 + player.x, cos(r) * d * 0.5 + player.y, sin(r) * 20, cos(r) * 20));
		    }
		    
		    if(time > 30) {
			return true;
		    }
		};
		
		return draw;
	    })());
	},
    },
    {
	name: 'Point\nDefense',
	desc: 'Destroy all on-screen bullets\n(including yours)',
	grade: grades.RARE,
	use: function() {
	    trauma += 0.2;
	    for(var i = 0; i < bullets.length; i++) {
		particles.push((function(sx, sy, x, y) {
		    var time = 0;

		    function draw() {
			var t = time / 6;
			stroke(0, 192, 255, (1 - t) * 255);
			strokeWeight(time + 1);
			line(lerp(sx, x, t), lerp(sy, y, t), x, y);
			time++;
			return time > 5;
		    };
		    
		    return draw;
		})(player.x, player.y, bullets[i].x, bullets[i].y));
	    }
	    bullets = [];
	},
    },
    {
	name: 'Boost',
	desc: 'Double speed for this turn',
	grade: grades.COMMON,
	use: function() {
	    upgrades.speed = 2;
	},
    },
    {
	name: 'Rapid fire',
	desc: 'Increased firerate for this turn',
	grade: grades.COMMON,
	use: function() {
	    upgrades.refire = 0.4;
	},
    },
    {
	name: 'The Escape',
	desc: 'Destroy all enemies and bullets\naround you in exchange for\n10 health',
	grade: grades.COMMON,
	use: function() {
	    trauma += 0.3;
	    for(var i = 0; i < enemies.length; i++) {
		if(dist(enemies[i].x, enemies[i].y, player.x, player.y) < 250) {
		    enemies[i].health = -1;
		}
	    }
	    for(var i = 0; i < bullets.length; i++) {
		if(dist(bullets[i].x, bullets[i].y, player.x, player.y) < 250) {
		    bullets[i].dead = true;
		}
	    }
	    particles.push((function(x, y) {
		var time = 0;
		function draw() {
		    time += 2;
		    noStroke();
		    fill(0, 192, 255, map(time, 0, 50, 255, 0));
		    ellipse(x, y, 500 + time * 0.5, 500 + time * 0.5);
		    return time > 50;
		};
		return draw;
	    })(player.x, player.y));
	    player.health -= 10;
	},
    },
    {
	name: 'Spreadshot',
	desc: 'Upgrade your weapon to shoot a\nfew shots in different directions',
	grade: grades.RARE,
	use: function() {
	    upgrades.bulletType = 2;
	},
    },
    {
	name: 'Laser',
	desc: 'Upgrade your weapon\nto shoot a laser',
	grade: grades.LEGENDARY,
	use: function() {
	    upgrades.bulletType = 3;
	    upgrades.refire = 0;
	},
    },
];

var Enemy = function(x, y, t) {
    this.x = x;
    this.y = y;
    this.t = t;
    this.maxHealth = 10;
    this.speed = 1;
    if(this.t == 1) {
	this.maxHealth = 20;
	this.speed = 0.8;
    } else if(this.t == 2) {
	this.maxHealth = 50;
	this.speed = 0.2;
    }
    this.health = this.maxHealth;
    this.refire = random(0, 512);
};

Enemy.prototype.update = function() {
    collideBullets({x: this.x, y: this.y, r: 32}, true, function(dmg) {
	this.damage(dmg);
    }.bind(this));
    this.y += timeSpeed * 0.9 * this.speed;
    if(this.health <= 0) {
	addScore([5, 9, 20][this.t], this.x, this.y);
	explosion(5, this.x, this.y);
	this.dead = true;
	trauma += 0.2;
    }
    if(this.refire > 512) {
	this.refire = 0;
	bullets.push(new Bullet(this.x, this.y, 0));
    }
    this.refire += timeSpeed;
    if(this.y > height + 64) {
	this.dead = true;
    }
};

Enemy.prototype.damage = function(dmg) {
    if(this.y > -64) {
	this.health -= dmg;
    }
};

Enemy.prototype.draw = function() {
    push();
    translate(this.x, this.y);
    rotate(PI);
    image(images.enemy, 0, 0, 32, 32);
    noStroke();
    fill(255, 0, 0);
    rect(-20, 30, 40, 5);
    fill(0, 255, 0);
    var s = map(this.health, 0, this.maxHealth, 0, 1);
    rect(20 - s * 40, 30, 40 * s, 5);
    pop();
};

var Player = function() {
    this.x = width * 0.5;
    this.y = height - 40;
    this.vx = 0;
    this.frame = 0;
    this.refire = 0;
    this.health = 80;
    this.maxHealth = 80;
    this.timer = 0;
    this.fireTime = 0;
};

Player.prototype.update = function() {
    collideBullets({x: this.x, y: this.y, r: 16}, false, this.damage.bind(this));
    this.x += this.vx * timeSpeed * upgrades.speed;
    this.vx *= pow(0.85, timeSpeed);
    if(keys[LEFT_ARROW] || keys[65]) {
	this.vx -= 1.3 * timeSpeed;
	this.frame -= timeSpeed;
    }
    if(keys[RIGHT_ARROW] || keys[68]) {
	this.vx += 1.3 * timeSpeed;
	this.frame += timeSpeed;
    }
    if(keys[32] && this.refire > 10 * upgrades.refire) {
	if(upgrades.bulletType == 2) {
	    bullets.push(new Bullet(this.x, this.y, 2, 0));
	    bullets.push(new Bullet(this.x, this.y, 2, -PI * 0.1));
	    bullets.push(new Bullet(this.x, this.y, 2, PI * 0.1));
	    trauma += 0.3;
	} else if(upgrades.bulletType == 3) {
	    bullets.push(new Bullet(this.x, this.y, 3));
	    if(this.timer > 1) {
		if(this.fireTime < 5) {
		    trauma += map(this.fireTime, 0, 5, 0.6, 0);
		    this.fireTime++;
		}
		this.timer = 0;
	    }
	    this.timer += timeSpeed;
	} else {
	    bullets.push(new Bullet(this.x, this.y, 1));
	    trauma += 0.1;
	}
	this.refire = 0;
    } else {
	this.fireTime = 0;
    }
    this.refire += timeSpeed;
    if(!keys[LEFT_ARROW] && !keys[RIGHT_ARROW]) {
	if(this.frame < 2.5) {
	    this.frame += timeSpeed;
	} else if(this.frame > 3.5) {
	    this.frame -= timeSpeed;
	} else {
	    this.frame = 3;
	}
    }
    if(this.dead) {
	if(!this.pdead) {
	    explosion(15, this.x, this.y);
	    this.pdead = true;
	    this.y = 1000000;
	    this.x = -100000;
	}
    } else {
	this.x = constrain(this.x, 10, width - 10);
    }
    this.frame = constrain(this.frame, 0, 6);
};

Player.prototype.damage = function(dmg) {
    trauma += dmg * 0.1;
    this.health -= dmg;
    if(this.health <= 0) {
	this.dead = true;
    }
};

Player.prototype.draw = function() {
    var frame = round(this.frame);
    noStroke();
    push();
    translate(this.x, this.y);
    fill(255, 0, 0);
    rect(-40, 30, 80, 5);
    fill(0, 255, 0);
    var s = map(this.health, 0, this.maxHealth, 0, 1);
    rect(-40, 30, 80 * s, 5);
    translate(0, -50);
    rotate(this.vx * 0.02);
    translate(0, 50);
    image(images.player, 0, 0, 32, 32);
    pop();
};

var Bullet = function(x, y, t, a) {
    this.x = x;
    this.y = y;
    this.t = t;
    this.a = a || 0;
};

Bullet.prototype.collide = function(c, isEnemy) {
    if(this.t == 0 && isEnemy) {
	return;
    }
    if(this.t != 0 && !isEnemy) {
	return;
    }
    if(this.t == 3) {
	if(abs(c.x - this.x) < c.r + 300) {
	    return true;
	}
	return false;
    } else {
	return dist(c.x, c.y, this.x, this.y) < c.r;
    }
};

Bullet.prototype.doDamage = function(dmgFunc) {
    dmgFunc(5);
};

Bullet.prototype.update = function() {
    if(this.y < -32 || this.y > height + 32) {
	this.dead = true;
    }
    if(this.t == 2) {
	this.x += sin(this.a) * timeSpeed * 16;
	this.y -= cos(this.a) * timeSpeed * 16;
    } else if(this.t == 3) {
	this.dead = true;
    } else {
	this.y += (this.t == 0 ? 0.1 : -1) * timeSpeed * 16;
    }
};

Bullet.prototype.draw = function() {
    push();
    if(this.t == 3) {
	strokeWeight(40);
	stroke(0, 192, 255, 90);
	fill(64, 224, 255);
	var w = random(290, 310);
	var h = random(500, 800);
	ellipse(this.x, this.y - h - 50, w, h * 2);
	noStroke();
	fill(255);
	ellipse(this.x, this.y - h - 30, w * 0.5, h * 2);
    } else {
	translate(this.x, this.y);
	if(this.t == 2) {
	    rotate(this.a);
	}
	if(this.t == 0) {
	    image(images.redBullet, 0, 0, 16, 32);
	} else {
	    image(images.greenBullet, 0, 0, 16, 32);
	}
    }
    pop();
};

var enemies = [];

var images = {
    'card': 'assets/cards/card.png',
    'particle': 'assets/particles/particle.png',
    'star': 'assets/particles/star.png',
    'player': 'assets/spaceships/player.png',
    'enemy': 'assets/spaceships/enemy.png',
    'redBullet': 'assets/bullets/red.png',
    'greenBullet': 'assets/bullets/green.png',
};

var stars = [];

var cardDeck = {
    transition: 1.0,
    flipTime: 0.0,
    currentCard: cardTypes[0],
    active: false,
    y: 384,
    cardsLeft: 5,
    random: function() {
	var grade = null;
	var total = 0;
	for(var gradeName in grades) {
	    total += grades[gradeName].chance;
	}
	var rand = random(total);
	for(var gradeName in grades) {
	    rand -= grades[gradeName].chance;
	    if(rand <= 0) {
		grade = grades[gradeName];
		break;
	    }
	}
	var choices = [];
	for(var i = 0; i < cardTypes.length; i++) {
	    if(cardTypes[i].grade.name == grade.name) {
		choices.push(cardTypes[i]);
	    }
	}
	return random(choices);
    },
    
    draw: function() {
	timeSpeed = lerp(timeSpeed, this.active ? 0.05 : 1, 0.2);
	if(this.active) {
	    this.y = lerp(this.y, 0, 0.2);
	} else {
	    this.y = lerp(this.y, 400, 0.2);
	}
	if(this.y > 384) {
	    return;
	}
	push();
	translate(0, this.y);
	for(var i = 11 - (this.transition + this.cardsLeft); i < 9.2; i++) {
	    drawCard(i * 20, height - 192 + pow((9 - i), 2) * 3, null);
	}
	this.flipTime += 0.1;
	drawCard(lerp(260, 180, this.transition), height - 192, this.currentCard, this.flipTime);
	this.transition = lerp(this.transition, 0.0, 0.2);
	if(this.active) {
	    if(this.cardsLeft > 1) {
		if(drawButton("[ESC] DISCARD", 190, height - 40, this.flipTime - 1)) {
		    this.next();
		}
	    }
	    if(drawButton("[RET] USE", 330, height - 40, this.flipTime - 1)) {
		this.currentCard.use();
		this.active = false;
	    }
	}
	pop();
    },

    next: function() {
	this.cardsLeft--;
	this.flipTime = -1;
	this.transition = 1.0;
	particles.push((function(card) {
	    var time = 0;
	    var x = 200;
	    var y = height - 192;
	    var xv = random(20, 50);
	    var yv = random(-5, -25);
	    var r = 0;
	    var rv = random(-0.05, 0.05);
	    function draw() {
		yv += 0.1;
		x += xv;
		y += yv;
		r += rv;
		push();
		translate(x, y);
		rotate(r);
		drawCard(0, 0, card, 2.0);
		pop();
		time++;
		return time > 35;
	    };
	    return draw;
	})(this.currentCard));
	this.currentCard = this.random();
    },
    
    activate: function() {
	this.transition = 0.0;
	this.currentCard = this.random();
	this.cardsLeft = 5;
	this.active = true;
	resetUpgrades();
    },
};

var particles = [];
var bullets = [];

var player;

function reset() {
    particles = []; bullets = []; player = new Player();
    pscore = score;
    hscore = max(hscore, score);
    score = 0;
    enemies = [];
    timeSpeed = 1;
    cardDeck.active = false;
    for(var i in timers) {
	timers[i] = 0;
	currentStage = 0;
    }
    stages = JSON.parse(JSON.stringify(oldStages));
};

function preload() {
    for(var i in images) {
	images[i] = loadImage(images[i]);
    }
}


function setup() {
    reset();
    frameRate(60);
    var canvas = createCanvas(800, 600);
    canvas.parent('canvas-root');
    imageMode(CENTER);
    for(var i = 0; i < 200; i++) {
	stars.push([random(0, width), random(0, height + 30), 1 / random(0.05, 0.5)]);
    }
    player = new Player();
}

var timeSpeed = 1;
var timers = {enemy: 0, card: 600};

function createEnemyGroup() {
    var x = random(128, width - 128);
    var y = -96;
    for(var i = 0; i < random(1, 4); i++) {
	enemies.push(new Enemy(x + random(-128, 128), y + random(-64, 64), 0));
    }
};

function createEnemyGroupT1() {
    var x = random(128, width - 128);
    var y = -96;
    for(var i = 0; i < random(1, 4); i++) {
	enemies.push(new Enemy(x + random(-128, 128), y + random(-64, 64), 1));
    }
};

function createEnemyGroupT2() {
    var x = random(128, width - 128);
    var y = -96;
    for(var i = 0; i < random(1, 4); i++) {
	enemies.push(new Enemy(x + random(-128, 128), y + random(-64, 64), 2));
    }

};

var fns = {
    createEnemyGroup:createEnemyGroup,
    createEnemyGroupT1:createEnemyGroupT1,
    createEnemyGroupT2:createEnemyGroupT2,
};

var oldStages = [
    {"type": "text", "text": "Now entering enemy territory. Stay sharp!", "time": 200},
    {
	"type": "survive",
	"time": 512,
	"timers": [
	    {
		"callback": "createEnemyGroup",
		"time": 96,
		"startAt": 0,
	    },
	],
    },
    {
	"type": "survive",
	"time": 512,
	"timers": [
	    {
		"callback": "createEnemyGroup",
		"time": 128,
		"startAt": 0,
	    },
	    {
		"callback": "createEnemyGroupT1",
		"time": 128,
		"startAt": 64,
	    },
	],
    },
    {
	"type": "survive",
	"time": -1000,
	"timers": [
	    {
		"callback": "createEnemyGroup",
		"time": 192,
		"startAt": 0,
	    },
	    {
		"callback": "createEnemyGroupT1",
		"time": 192,
		"startAt": 64,
	    },
	    {
		"callback": "createEnemyGroupT2",
		"time": 192,
		"startAt": 128,
	    },
	],
    },
];

var stages = JSON.parse(JSON.stringify(oldStages));

var currentStage = 0;

var nextStage = function() {
    currentStage++;
    if(currentStage >= stages.length) {
	currentStage--;
	return;
    }
    var stage = stages[currentStage];
    if(stage.timers) {
	for(var i = 0; i < stage.timers.length; i++) {
	    timers["sttimer" + i] = -stage.timers[i].startAt;
	}
    }
};

function isCompleted(s) {
    if(s.type == "destroy") {
	return s.time <= 0 && enemies.length == 0;
    } else {
	return s.time <= 0 && s.time > -100;
    }
};

var tutorialI = 0, tutorialT = 0;

var time = 0, deadTime = 0;

var score = 0, hscore = 0, pscore = 0;

function draw() {
    if(tutorialI < tutorial.length) {
	cursor('default');
	tutorialT += 0.1;
	background(0);
	textFont('ArchivoBlackRegular');
	fill(255);
	noStroke();
	textAlign(CENTER, TOP);
	textSize(40);
	text(tutorial[tutorialI][0], width * 0.5, 20);
	textAlign(LEFT, TOP);
	textSize(20);
	text(tutorial[tutorialI][1], 25, 90);
	if(drawButton("[RET] NEXT PAGE", width * 0.5, height - 40, tutorialT)) {
	    tutorialT = 0;
	    tutorialI++;
	}
	mouseClick = false;
	keyRelease = [];
	return;
    }
    for(var t in timers) {
	timers[t] += timeSpeed;
    }
    cursor('default');
    background(0);

    if(stages[currentStage].timers) {
	for(var i = 0; i < stages[currentStage].timers.length; i++) {
	    if(timers["sttimer" + i] > 0) {
		timers["sttimer" + i] = -stages[currentStage].timers[i].time;
		fns[stages[currentStage].timers[i].callback]();
	    }
	}
    }
    
    stages[currentStage].startTime = (stages[currentStage].startTime ? stages[currentStage].startTime : stages[currentStage].time);
    if(stages[currentStage].time > 0) {
	stages[currentStage].time--;
    }
    if(isCompleted(stages[currentStage])) {
	nextStage();
    }
    trauma = constrain(trauma - timeSpeed * 0.04, 0, 1);
    time += timeSpeed * 0.4;
    var shake = trauma * 30;
    var shakeX = (noise(time, 0) * 2 - 1) * shake, shakeY = (noise(0, time) * 2 - 1) * shake;
    
    for(var i = 0; i < stars.length; i++) {
	stars[i][1] += stars[i][2] * 0.02 * timeSpeed;
	stars[i][1] = ((stars[i][1] + height + 15) % (height + 30)) + 15;
	var s = stars[i][2] * 2;
	image(images.star, stars[i][0] + shakeX * s * 0.005, stars[i][1] + shakeY * s * 0.005, s, s);
    }

    push();
    translate(shakeX, shakeY);

    for(var i = 0; i < bullets.length; i++) {
	if(bullets[i].dead) {
	    bullets.splice(i, 1);
	    i--;
	    continue;
	}
	bullets[i].update();
	bullets[i].draw();
    }
    for(var i = 0; i < enemies.length; i++) {
	enemies[i].update();
	enemies[i].draw();
	if(enemies[i].dead) {
	    enemies.splice(i, 1);
	    i--;
	    continue;
	}
    }

    player.update();
    player.draw();

    if(timers.card > 720 && !player.dead) {
	timers.card = 0;
	cardDeck.activate();
    }

    for(var i = 0; i < particles.length; i++) {
	if(particles[i]()) {
	    particles.splice(i, 1);
	    i--;
	}
    }

    var s = stages[currentStage];
    if(s.type == "text") {
	var alph = constrain(map(s.time, 25, 0, 255, 0), 0, 255);
	noStroke();
	fill(0, 64, 0, alph * 0.2);
	rect(0, 0, width, 42);
	textAlign(LEFT, TOP);
	textFont('ArchivoBlackRegular');
	textSize(19);
	fill(255, alph);
	noStroke();
	text(s.text.substr(0, s.startTime - s.time), 15, 5);
    } else if(s.type == "centertext") {
	var alph = constrain(map(s.time, 25, 0, 255, 0), 0, 255);
	alph *= constrain(map(s.time, s.startTime, s.startTime - 25, 0, 1), 0, 1);
	alph *= sin(frameCount * 0.1) * 0.2 + 0.8;
	fill(s.color, alph);
	stroke(0, 0, 0, alph);
	strokeWeight(10);
	textAlign(CENTER, CENTER);
	textSize(40);
	text(s.text, width * 0.5, 50);
    }
    
    cardDeck.draw();
    pop();


    if(player.dead) {
	fill(0, 0, 0, constrain(deadTime * 2, 0, 50));
	rect(0, 0, width, height);
	fill(255, 255, 255, deadTime * 5);
	textSize(50);
	textAlign(CENTER, CENTER);
	text("GAME OVER", width * 0.5, 100);
	textSize(20);
	text("FINAL SCORE: " + score, width * 0.5, 200);
	textSize(30);
	text("HIGH SCORE: " + max(hscore, score), width * 0.5, 240);
	if(drawButton("[RET] RESTART?", width * 0.5, 300, deadTime * 0.05)) {
	    reset();
	}
	deadTime++;
    }
    textSize(20);
    textAlign(RIGHT, TOP);
    text(score, width - 5, 5);
    mouseClick = false;
    keyRelease = [];
}

function drawButton(t, x, y, trans) {
    textFont('ArchivoBlackRegular');
    textSize(12);
    textAlign(CENTER, CENTER);
    noStroke();

    var hover = false;
    if(mouseX > x - 40 && mouseX < x + 40 &&
       mouseY > y - 12 && mouseY < y + 12 && trans > 1.0) {
	hover = true;
    }
    
    push();
    translate(x, y);
    scale(sin(constrain(trans, 0, 1) * PI * 0.5), 1.0);
    if(hover) {
	scale(1.05);
    }
    fill(255);
    rect(-60, -12, 120, 24, 4);
    fill(0);
    text(t, 0, 0);
    pop();

    if(t.indexOf("RET") != -1) {
	if(keyRelease[13]) {
	    return true;
	}
    }
    if(t.indexOf("ESC") != -1) {
	if(keyRelease[27]) {
	    return true;
	}
    }
    
    if(hover) {
	cursor('pointer');
	if(mouseClick) {
	    return true;
	}
    }
}

function drawCard(x, y, t, flip) {
    textFont('ArchivoBlackRegular');

    push();
    if(t != null && flip > 1.0) {
	tint(t.grade.color);
    }
    translate(x, y);
    scale(abs(cos(constrain(flip, 0, 2) * PI * 0.5)), 1.0);
    image(images.card, 0, 0, 256, 384);
    
    noStroke();
    if(t != null && flip > 1.0) {
	fill(lerpColor(color(t.grade.color), color(0), 0.7));
	textAlign(CENTER, CENTER);
	textSize(22);
	text(t.name, 0, -120);
	textSize(10);
	text(t.desc, 0, 0);
	text(t.grade.name, 0, 120);
    }
    pop();
}

function mouseReleased() {
    mouseClick = true;
}

function keyPressed() {
    keys[keyCode] = true;
}
function keyReleased() {
    keys[keyCode] = false;
    keyRelease[keyCode] = true;
};
