var canvas;
var ctx;
var gameTimer;
var messageTimer;

var setup_rows = 4;
var setup_columns = 8;

var spd = 3;
var squadMoveDir = spd;
var changeDir = 0;
var squad = [];
var score = 0;
var wave = 0;
var newWave = 0;
var bossSpeed = 3;
var playerMaxShots = 5;


var msg = {
	message: "",
	x: 270,
	y: 400
};
var oldMsg = msg;

var plr = {
	ox: 10,
	oy: 10,
	y: 700,
	x: 380,
	shot: [],
	shield: 1000
};

var boss = {
	dir: 5,
	ox: 10,
	oy: 10,
	y: 10,
	x: 10,
	shot: [],
	alive: false
}

var gameOver = function() {
	ctx.fillStyle="#000000";
	ctx.fillRect(0,0,800,800);
	clearTimeout(gameTimer);
	clearTimeout(messageTimer);
	setTimeout(displayGameover, 1000);
}

var updateMessage = function(message, delay) {
	msg = message;
	if (msg.message != "") {
		setTimeout(updateMessage, delay, {message:"", x:50, y:50});
	};
}

var displayGameover = function() {
	ctx.fillStyle="#000000";
	ctx.fillRect(0,0,800,800);
	ctx.fillStyle="#ffffff";
	ctx.font = "32px Verdana";
	ctx.fillText("You failed, Score : " + score, 220, 400);
}

var setUp = function() {
	canvas = document.getElementById("canvasMain");
	ctx = canvas.getContext("2d");
	window.addEventListener('keydown', keyDownEvent, false);
	generateInvaders();
	setTimeout(spawnBoss, getBossSpawnTime());
	setTimeout(updateMessage, 2000, {message:"I N V A D E R S (tm)", x:270, y:400}, 4000);
	gameTimer = setInterval(mainTick, 10);
	messageTimer = setInterval(displayMessage, 500);
};

var displayMessage = function() {
	if (msg.message != oldMsg.message) {
		ctx.fillStyle="#ffffff";
		ctx.fillRect(5, (oldMsg.y - 30), 780, 40);
		oldMsg = msg;
	}
	ctx.font = "36px Arial";
	ctx.fillStyle="#000000";
	ctx.fillText(msg.message, msg.x, msg.y);
}

var getBossSpawnTime = function() {
	var bossTime = 25000 - (1000 * wave);
	if (bossTime < 2000) {
		bossTime = 2000;
	}
	return bossTime;
}

var generateInvaders = function() {
	squad = [];
	wave++;
	for (var y = 1; y <= setup_rows; y++) {
		for (var x = 1; x <= setup_columns; x++) {
			
			var newInvader = {
				y : (10 + (25 * y)),
				x : (10 + (45 * x)),
				ox : 10,
				oy : 10,
				alive : true,
				phase : 0,
				shot : {
					alive: false,
					sy : 10,
					sx : 10,
					soy : 10,
					sox : 10,
					shotSize : 5
				}
			};
			
			squad.push(newInvader);
			
		};
	};
	newWave = 0;
}

var spawnBoss = function() {
	if (!boss.alive) {
		boss.dir = bossSpeed;
		boss.y = 30;
		boss.x = 15;
		if (Math.random() > .65) {
			boss.dir = -bossSpeed;
			boss.x = 750;
		}
		boss.alive = true;
		boss.shot = [];
	}
	setTimeout(spawnBoss, getBossSpawnTime());
}

var keyDownEvent = function(event) {
	const key = event.keyCode;
	if (key == 65 && plr.x > 20) {
		plr.x = plr.x - 20;
	}
	if (key == 68 && plr.x < 740) {
		plr.x = plr.x + 20;
	}
	if (key == 32) {
		if (plr.shot.length != playerMaxShots) {
			var newShot = {
				sy: 690,
				sx: (plr.x + 10),
				sox: 10,
				soy: 10
			};
			plr.shot.push(newShot);
		}
	}
};

var drawInvader = function(item, index) {
	if (item.alive) {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(item.ox, item.oy, 10, 10);
		if (item.phase >= 0 && item.phase <= 4) {
			ctx.fillStyle = "#000000";
			ctx.fillRect(item.x, item.y, 10, 10);
		}
		if (item.phase >= 5 && item.phase <= 9) {
			ctx.fillStyle = "#00aa00";
			ctx.fillRect(item.x, item.y, 10, 10);
		}
		if (item.phase >= 10) {
			ctx.fillStyle = "#00aaaa";
			ctx.fillRect(item.x, item.y, 10, 10);
		}
	}
};

var drawSquad = function() {
	squad.forEach(drawInvader);
};

var moveSquadDown = function() {
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			squad[i].y = squad[i].y + 20;
			if (squad[i].y > 690) {
				gameOver();
				return;
			};
		}
	}
}

var waveCheck = function() {
	var aliveCount = 0;
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			aliveCount++;
		}
	}
	if (aliveCount == 0 && newWave == 0) {
		newWave = 1;
		score = score + 1000;
		setTimeout(updateMessage, 250, {message:"W A V E   C O M P L E T E !", x:200, y:400}, 4500);
		setTimeout(generateInvaders, 5000);
	}
	var perc = (100 / squad.length) * aliveCount;
	var speedInc = (25 / 100) * (100 - perc);
	spd = 5 + parseInt(speedInc);
}

var moveSquad = function() {
	
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			squad[i].phase = squad[i].phase + 1;
			if (squad[i].phase > 14) {
				squad[i].phase = 0;
				squad[i].ox = squad[i].x;
				squad[i].oy = squad[i].y;
				squad[i].x = squad[i].x + squadMoveDir;
				if (squad[i].x > 760) {
					changeDir = -spd;
				}
				if (squad[i].x < 40) {
					changeDir = spd;
				}
			}
			if (Math.random() > .999 && !squad[i].shot.alive) {
				squad[i].shot.alive = true;
				squad[i].shot.sy = squad[i].y;
				squad[i].shot.sx = squad[i].x;
			}
		}
		
		if (squad[i].shot.alive) {
			enemyShot(squad[i].shot, 0);
		}
		
	};
	
	if (changeDir != 0) {
		squadMoveDir = changeDir;
		changeDir = 0;
		moveSquadDown();
	}
};


var drawPlayer = function() {
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(plr.ox, plr.oy, 40, 10);
	ctx.fillStyle = "#0000aa";
	ctx.fillRect(plr.x, plr.y, 40, 10);
	plr.ox = plr.x;
	plr.oy = plr.y;
	
	if (plr.shield < 1000) {
		plr.shield = plr.shield + 1;
	}
	
	plr.shot.forEach(playerShot);
	
}

var explodeShot = function(expX, expY, size) {
	var explosion = {
		ex: expX,
		ey: expY,
		dir: size,
		size: 2,
		osize: 2,
		exsize: size
	};
	setTimeout(manageExplosion, 15, explosion);
}

var manageExplosion = function(explosion) {
	var oldSizeHalf = parseInt(explosion.osize / 2);
	var newSizeHalf = parseInt(explosion.size / 2);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(explosion.ex - oldSizeHalf , explosion.ey - oldSizeHalf, explosion.osize, explosion.osize);
	if (Math.random() > .82) {
		ctx.fillStyle = "#ffff00";
	} else {
		ctx.fillStyle = "#ff0000";
	}
	ctx.fillRect(explosion.ex - newSizeHalf, explosion.ey - newSizeHalf, explosion.size, explosion.size);
	explosion.osize = explosion.size;
	explosion.size = explosion.size + explosion.dir;
	explosion.dir = explosion.dir - 1;
	if (explosion.dir < -explosion.exsize) {
		oldSizeHalf = parseInt(explosion.osize / 2);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(explosion.ex - oldSizeHalf , explosion.ey - oldSizeHalf, explosion.osize, explosion.osize);
	} else {
		setTimeout(manageExplosion, 15, explosion);
	}
}

var enemyShot = function(item, index) {
	if (item.alive) {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(item.sox, item.soy, 5, 5);
		ctx.fillStyle = "#aa0000";
		ctx.fillRect(item.sx, item.sy, 5, 5);
		item.sox = item.sx;
		item.soy = item.sy;
		
		item.sy = item.sy + 2;
		if (item.sy > 700) {
			explodeShot(item.sx, item.sy, item.shotSize);
			item.alive = false;
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(item.sx, item.sy, 5, 5);
			ctx.fillRect(item.sox, item.soy, 5, 5);
		} else {
			/* Hit detection START */
			if (item.sx >= (plr.x - 4) && item.sx <= (plr.x + 39)) {
				if (item.sy >= (plr.y - 4) && item.sy <= (plr.y + 39)) {
			/* Hit detection END */
					explodeShot(item.sx, item.sy, item.shotSize);
					item.alive = false;
					ctx.fillStyle = "#ffffff";
					ctx.fillRect(item.sx, item.sy, 5, 5);
					ctx.fillRect(item.sox, item.soy, 5, 5);
					var damage = 20 + parseInt(25 * item.shotSize * (Math.random() * 5));
					plr.shield = plr.shield - damage;
					if (plr.shield < 0) {
						plr.shield = 0;
						gameOver();
					}
				}
			}
		}
	}
}

var playerShot = function(item, index) {
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(item.sox, item.soy, 5, 5);
	ctx.fillStyle = "#aa0000";
	ctx.fillRect(item.sx, item.sy, 5, 5);
	item.sox = item.sx;
	item.soy = item.sy;
	
	item.sy = item.sy - 10;
	if (item.sy < 20) {
		plr.shot.splice(index, 1);
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(item.sx, item.sy, 5, 5);
		ctx.fillRect(item.sox, item.soy, 5, 5);
	} else {
		for (var i = 0; i < squad.length; i++) {
			if (squad[i].alive) {
				/* Hit detection START */
				if (item.sx >= (squad[i].x - 4) && item.sx <= (squad[i].x + 9)) {
					if (item.sy >= (squad[i].y - 4) && item.sy <= (squad[i].y + 9)) {
				/* Hit detection END */
						score = score + 15;
						explodeShot(item.sx, item.sy, 8);
						squad[i].alive = false;
						plr.shot.splice(index, 1);
						ctx.fillStyle = "#ffffff";
						ctx.fillRect(item.sx, item.sy, 5, 5);
						ctx.fillRect(item.sox, item.soy, 5, 5);
						ctx.fillRect(squad[i].x, squad[i].y, 10, 10);
						ctx.fillRect(squad[i].ox, squad[i].oy, 10, 10);
					}
				}
			}
		}
		if (boss.alive) {
			if (item.sx >= (boss.x - 4) && item.sx <= (boss.x + 49)) {
				if (item.sy >= (boss.y - 4) && item.sy <= (boss.y + 19)) {
					updateMessage({message:"E X C E L L E N T !", x:245, y:400}, 3000);
					score = score + 2500;
					explodeShot(item.sx, item.sy, 20);
					boss.alive = false;
					plr.shot.splice(index, 1);
					ctx.fillRect(item.sx, item.sy, 5, 5);
					ctx.fillRect(item.sox, item.soy, 5, 5);
					ctx.fillStyle = "#ffffff";
					ctx.fillRect(boss.ox, boss.oy, 50, 20);
				}
			}
		}
	}
}

var displayShield = function() {
	ctx.fillStyle="#000000";
	ctx.fillRect(588,758,204,34);
	var perc = parseInt(((200 / 1000) * plr.shield));
	ctx.fillStyle="#00dddd";
	ctx.fillRect(590,760,perc,30);
};

var displayScore = function() {
	ctx.fillStyle="#ffffff";
	ctx.fillRect(10,760,550,30);
	ctx.fillStyle="#000000";
	ctx.font = "26px Verdana";
	ctx.fillText("Score: " + score, 15, 785);
	ctx.fillText("Wave: " + wave, 310, 785);
}

var drawBoss = function() {
	if (boss.alive) {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(boss.ox, boss.oy, 50, 20);
		ctx.fillStyle = "#ff0000";
		ctx.fillRect(boss.x, boss.y, 50, 20);
		boss.ox = boss.x;
		boss.oy = boss.y;
		moveBoss();
	}
	boss.shot.forEach(enemyShot);
}

var moveBoss = function() {
	boss.x = boss.x + boss.dir;
	if ((boss.dir > 0 && boss.x > 745) || (boss.dir < 0 && boss.x < 10)) {
		boss.alive = false;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(boss.ox, boss.oy, 50, 20);
	}
	if (boss.x > 200 && boss.x < 600 && Math.random() > .9) {
		var xx = boss.x;
		var yy = boss.y + 20;
		var newShot = {
			sox: 10,
			soy: 10,
			sy: yy,
			sx: xx,
			alive: true,
			shotSize: 12
		};
		boss.shot.push(newShot);
	}
}

var mainTick = function() {
	drawBoss();
	drawPlayer();
	drawSquad();
	moveSquad();
	//playerShot();
	displayShield();
	displayScore();
	waveCheck();
};

