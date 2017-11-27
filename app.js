var canvas;						/* Object representing the HTML Canvas element */
var ctx;						/* 2D context from the Canvas object, used for drawing to Canvas */

var gameTimer;					/* Handle for timer so we can stop it manually (i.e. game over). */
var messageTimer;				/* Handle for timer so we can stop it manually (i.e. game over). */

var setup_rows = 4;				/* Invader row size */
var setup_columns = 8;			/* Invader column size */

var spd = 3;					/* Invader initial speed */
var squadMoveDir = spd;			/* Current direction on X the Invaders are moving */
var changeDir = 0;				/* New direction indicator when one of the Invaders hits an edge, but doesn't change direction until entire array has moved firest */
var squad = [];					/* Collection of Invader objects */
var score = 0;					/* Player score */
var wave = 0;					/* Current Wave */
var newWave = 0;				/* Flag to control when a New Wave has been triggered and manages message and regenration of Invader array */
var bossSpeed = 3;				/* CONSTANT : Speed at which the boss flies across the screen */
var playerMaxShots = 5;			/* CONSTANT : Maximum number of shots the player can spawn in one go */

/* Message Object, displays message at given position */
var msg = {
	message: "",
	x: 270,
	y: 400
};
var oldMsg = msg;

/* Player Object */
/*
	ox : Old X Position (Used for removing old draw position)
	oy : Old Y Position
	y : Player Y position (static, but could allow Y movement)
	x : Player X position
	shot : Array holding shot objects created by the player when they press SPACE.
	shield: Current shield level (0-1000), game over at 0 or below!
*/
var plr = {
	ox: 10,
	oy: 10,
	y: 700,
	x: 380,
	shot: [],
	shield: 1000
};

/* Boss Object */
/*
	dir: Direction and speed of boss
	ox: Old X position (for removing old position)
	oy: Old Y position
	y: Boss Y position
	x: Boss X position
	shot: Array of shots spawned by the Boss as it flies across the screen
	alive: flag to indicate boss is currently on screen or not
*/
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
	ctx.fillStyle="#000000";																			// BLACK
	ctx.fillRect(0,0,800,800);																			// Entire Canvas is set to BLACK
	clearTimeout(gameTimer);																			// Disables Game Timer, stop invaders and draw routines for continuing.
	clearTimeout(messageTimer);																			// Disables messages from appearing/rendering.
	setTimeout(displayGameover, 1000);																	// Allows 1 second for any animations to complete before displaying final game over message.
}

var updateMessage = function(message, delay) {
	msg = message;
	if (msg.message != "") {
		/* If we have a message set, call ourself after delay to remove that message from screen */
		setTimeout(updateMessage, delay, {message:"", x:50, y:50});
	};
}

var displayGameover = function() {
	ctx.fillStyle="#000000";																			// BLACK
	ctx.fillRect(0,0,800,800);																			// Clear entire screen
	ctx.fillStyle="#ffffff";																			// WHITE
	ctx.font = "32px Verdana";								
	ctx.fillText("You failed, Score : " + score, 220, 400);	
}

var setUp = function() {
	canvas = document.getElementById("canvasMain");														// Grab Canvas object from HTML markup/document.
	ctx = canvas.getContext("2d");																		// Get 2D Context from Canvas.
	window.addEventListener('keydown', keyDownEvent, false);											// Setup key listener for player controls.
	generateInvaders();																					// Initialise Invader array
	setTimeout(spawnBoss, getBossSpawnTime());															// Set Boss to appear after a set time
	setTimeout(updateMessage, 2000, {message:"I N V A D E R S (tm)", x:270, y:400}, 4000);				// Display title after 2 seconds, show it for 4 seconds.
	gameTimer = setInterval(mainTick, 10);																// Start main game timer, 10ms (100fps)
	messageTimer = setInterval(displayMessage, 500);													// Start message timer, updating every 1/2 second.
};

var displayMessage = function() {
	if (msg.message != oldMsg.message) {
		/* New message detected, removed old message with white rectangle (full width of screen) */
		ctx.fillStyle="#ffffff";																		// WHITE
		ctx.fillRect(5, (oldMsg.y - 30), 780, 40);														// White rectangle to cover up old text, may cause slight flicker when drawing over bullets etc 
		oldMsg = msg;																					// Set old message so we dont do this again unless a new message comes through.
	}
	ctx.font = "36px Arial";
	ctx.fillStyle="#000000";																			// BLACK
	ctx.fillText(msg.message, msg.x, msg.y);															// Write out current message
}

var getBossSpawnTime = function() {
	var bossTime = 25000 - (1000 * wave);																// Boss spawn time, 25 seconds minus a second for each wave passed.
	if (bossTime < 2000) {																				// Ensure we are not spawning the boss less than every 2 seconds
		bossTime = 2000;																				
	}
	return bossTime;
}

var generateInvaders = function() {
	squad = [];																							// Clear the Invader array
	wave++;																								// Increase wave number
	for (var y = 1; y <= setup_rows; y++) {																// Loop through row size
		for (var x = 1; x <= setup_columns; x++) {														// Loop through column size	
			
			/* New Invader Object:
				y: Invader Y position
				x: Invader X position
				ox: Invader old X position
				oy: Invader old Y position
				alive: if invader is alive (controls render and firing)
				phase: Animation phase, for changing sprite/colour (not using sprites yet)
				shot: Shot object for each invader.
					alive: shot is active?
					sy: shot Y position
					sx: shot X position
					soy: shot old Y position
					sox: shot old X position
					shotSize: size of the explosion animation (also determines damage range)
			*/
			var newInvader = {																			
				x : (10 + (45 * x)),
				y : (10 + (25 * y)),			
				ox : 10,
				oy : 10,
				alive : true,
				phase : 0 + parseInt(Math.random() * 60),
				shot : {
					alive: false,
					sy : 10,
					sx : 10,
					soy : 10,
					sox : 10,
					shotSize : 5
				}
			};
			
			squad.push(newInvader);																		// Push/Add new invader object to array
			
		};
	};
	newWave = 0;																						// Flag for indicating a new wave to be generated, zero means it has been completed/not required.
}

var spawnBoss = function() {
	if (!boss.alive) {																					// Check if boss is currently on screen before spawning another 
																										// (BUG: bullets in progress at higher waves still could be falling when spawn is called, creating graphical issue)
		boss.dir = bossSpeed;
		boss.y = 30;
		boss.x = 15;
		if (Math.random() > .65) {																		// Using Math.Random to set which side (left/right) of the screen to spawn the boss 
			boss.dir = -bossSpeed;
			boss.x = 750;
		}
		boss.alive = true;
		boss.shot = [];																					// Clear all shots from array (BUG: shots could already be falling, need to check first)
	}
	setTimeout(spawnBoss, getBossSpawnTime());															// Setup next check for spawning a new boss (2-25 seconds)
}

var keyDownEvent = function(event) {
	const key = event.keyCode;
	if (key == 65 && plr.x > 20) {																		// Key "A", Moves player left
		plr.x = plr.x - 20;
	}
	if (key == 68 && plr.x < 740) {																		// Key "D", Moves player right
		plr.x = plr.x + 20;
	}
	if (key == 32) {																					// Key "SPACE", fires weapon
		if (plr.shot.length != playerMaxShots) {														// Ensure we have availabel shot
			var newShot = {
				sy: 690,
				sx: (plr.x + 10),
				sox: 10,
				soy: 10
			};
			plr.shot.push(newShot);																		// Add shot to array, drawing routing will track draw and hit detection.
		}
	}
};

var drawInvader = function(item, index) {
	if (item.alive) {																					// Check invader is alive before drawing (explosion will take care of removing old drawing)
		ctx.fillStyle = "#ffffff";																		// WHITE
		ctx.fillRect(item.ox, item.oy, 10, 10);															// Remove old drawing
		/* Crude animation of each Invader */
		if (item.phase >= 0 && item.phase <= 20) {
			ctx.fillStyle = "#000000";																	// BLACK
			ctx.fillRect(item.x, item.y, 10, 10);
		}
		if (item.phase >= 21 && item.phase <= 40) {
			ctx.fillStyle = "#00aa00";																	// GREEN
			ctx.fillRect(item.x, item.y, 10, 10);
		}
		if (item.phase >= 40) {
			ctx.fillStyle = "#00aaaa";																	// CYAN
			ctx.fillRect(item.x, item.y, 10, 10);
		}
	}
};

var drawSquad = function() {
	squad.forEach(drawInvader);																			// For each invader in "squad", call drawInvader()
};

var moveSquadDown = function() {
	/* Move all alive invaders down the screen */
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			squad[i].y = squad[i].y + 20;
			if (squad[i].y > 690) {
				/* Invaders have reached the player level, end game */
				gameOver();
				return;
			};
		}
	}
}

var waveCheck = function() {
	var aliveCount = 0;
	/* Count how many Invaders are currently alive */
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			aliveCount++;
		}
	}
	if (aliveCount == 0 && newWave == 0) {
		/* If no invaders are alive and we havnt already noticed (newWave) */
		newWave = 1;																								// Stop this check running again
		score = score + 1000;
		setTimeout(updateMessage, 250, {message:"W A V E   C O M P L E T E !", x:200, y:400}, 4500);				// Display "wave complete" message for 4.5 seconds.
		setTimeout(generateInvaders, 5000);																			// After 5 seconds, generate new invaders array
	}
	var perc = (100 / squad.length) * aliveCount;																	// Calculate percentage of Invaders alive
	var speedInc = (25 / 100) * (100 - perc);																		// Set speed of invaders based on percentage alive
	spd = 5 + parseInt(speedInc);																					// Set new invader speed
}

var moveSquad = function() {
	
	for (var i = 0; i < squad.length; i++) {
		if (squad[i].alive) {
			squad[i].phase = squad[i].phase + 3;																	// Move Invader animation phase
			if (squad[i].phase > 60) {			
				squad[i].phase = 0;																					// Reset animation phase
				squad[i].ox = squad[i].x;
				squad[i].oy = squad[i].y;
				squad[i].x = squad[i].x + squadMoveDir;																// Move invader in set X direction
				if (squad[i].x > 760) {																				// If invader hits right boundary, trigger direction change.
					changeDir = -spd;
				}
				if (squad[i].x < 40) {																				// If invader hits left boundary, trigger direction change.
					changeDir = spd;
				}
			}
			if (Math.random() > .999 && !squad[i].shot.alive) {														// Randomily decide to spawn a shot (if one doesn't already exist for this invader)
				squad[i].shot.alive = true;
				squad[i].shot.sy = squad[i].y;
				squad[i].shot.sx = squad[i].x;
			}
		}
		
		if (squad[i].shot.alive) {																					// Draw invader shot if it's active, regardless if the invader is alive or not.
			enemyShot(squad[i].shot, 0);					
		}
		
	};
	
	if (changeDir != 0) {																							// If direction has been changed, update invader X direction speed.
		squadMoveDir = changeDir;
		changeDir = 0;
		moveSquadDown();
	}
};


var drawPlayer = function() {
	ctx.fillStyle = "#ffffff";																						// WHITE
	ctx.fillRect(plr.ox, plr.oy, 40, 10);
	ctx.fillStyle = "#0000aa";																						// BLUE
	ctx.fillRect(plr.x, plr.y, 40, 10);
	plr.ox = plr.x;
	plr.oy = plr.y;
	
	if (plr.shield < 1000) {
		plr.shield = plr.shield + 1;																				// Regenerate shield per frame (it's fairly quick)
	}
	
	plr.shot.forEach(playerShot);																					// Handle any shots player has spawned
	
}

/* Creates new explosion at given posistion */
var explodeShot = function(expX, expY, size) {
	/* Explosion object
		ex: Explosion X position,
		ey: Explosion Y position,
		dir: Size growth speed,
		size: Current size of the explosion (rectangle)
		osize: Old size (for removing graphic, helps when explosion is shrinking)
		exsize: original size of explosion, used to determine end of explosion animation.
	*/
	var explosion = {
		ex: expX,
		ey: expY,
		dir: size,
		size: 2,
		osize: 2,
		exsize: size
	};
	setTimeout(manageExplosion, 5, explosion);
}

var manageExplosion = function(explosion) {
	var oldSizeHalf = parseInt(explosion.osize / 2);																	// Get half the size of the explosion, used for centering co-ords
	var newSizeHalf = parseInt(explosion.size / 2);
	ctx.fillStyle = "#ffffff";																							// WHITE
	ctx.fillRect(explosion.ex - oldSizeHalf , explosion.ey - oldSizeHalf, explosion.osize, explosion.osize);			// Remove old drawing
	if (Math.random() > .82) {
		ctx.fillStyle = "#ffff00";																						// YELLOW
	} else {
		ctx.fillStyle = "#ff0000";																						// RED
	}
	ctx.fillRect(explosion.ex - newSizeHalf, explosion.ey - newSizeHalf, explosion.size, explosion.size);
	explosion.osize = explosion.size;
	explosion.size = explosion.size + explosion.dir;
	explosion.dir = explosion.dir - 1;
	if (explosion.dir < -explosion.exsize) {																			// End of explosion, remove graphic and end.
		oldSizeHalf = parseInt(explosion.osize / 2);															
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(explosion.ex - oldSizeHalf , explosion.ey - oldSizeHalf, explosion.osize, explosion.osize);
	} else {
		setTimeout(manageExplosion, 5, explosion);																		// Still growing/shrinking explosion, call itself to continue animating.
	}
}

var enemyShot = function(item, index) {
	if (item.alive) {																									// Shot is active
		ctx.fillStyle = "#ffffff";																						// WHITE
		ctx.fillRect(item.sox, item.soy, 5, 5);
		ctx.fillStyle = "#aa0000";																						// RED
		ctx.fillRect(item.sx, item.sy, 5, 5);
		item.sox = item.sx;
		item.soy = item.sy;
		
		item.sy = item.sy + 2;																							// Move shot down the screen
		if (item.sy > 700) {																							// Shot has reached the ground, destroy it.
			explodeShot(item.sx, item.sy, item.shotSize);																// Trigger explosion at shot's last co-ords.
			item.alive = false;																							// Disable shot
			ctx.fillStyle = "#ffffff";																					// WHITE
			ctx.fillRect(item.sx, item.sy, 5, 5);
			ctx.fillRect(item.sox, item.soy, 5, 5);
		} else {
			/* Hit detection START */
			if (item.sx >= (plr.x - 4) && item.sx <= (plr.x + 39)) {
				if (item.sy >= (plr.y - 4) && item.sy <= (plr.y + 39)) {
			/* Hit detection END */
					explodeShot(item.sx, item.sy, item.shotSize);														// Hit player, spawn explision at shot co-ords
					item.alive = false;																					// Disable shot
					ctx.fillStyle = "#ffffff";																			// WHITE
					ctx.fillRect(item.sx, item.sy, 5, 5);
					ctx.fillRect(item.sox, item.soy, 5, 5);
					var damage = 20 + parseInt(25 * item.shotSize * (Math.random() * 5));								// Calculate damage based on shot size
					plr.shield = plr.shield - damage;																	// Reduce shield by damage
					if (plr.shield < 0) {																				// Player has no shields left!
						plr.shield = 0;																					// Set shield to zero to avoid shield display from looking wonky
						gameOver();																						// Trigger game over.
					}
				}
			}
		}
	}
}

var playerShot = function(item, index) {
	ctx.fillStyle = "#ffffff";																							// WHITE
	ctx.fillRect(item.sox, item.soy, 5, 5);	
	ctx.fillStyle = "#aa0000";																							// RED
	ctx.fillRect(item.sx, item.sy, 5, 5);
	item.sox = item.sx;
	item.soy = item.sy;
	
	item.sy = item.sy - 10;																								// Move shot up the screen
	if (item.sy < 20) {																									// Shot has reached top of screen
		plr.shot.splice(index, 1);																						// Remove shot from array
		ctx.fillStyle = "#ffffff";																						// WHITE
		ctx.fillRect(item.sx, item.sy, 5, 5);
		ctx.fillRect(item.sox, item.soy, 5, 5);
	} else {
		for (var i = 0; i < squad.length; i++) {																		// Loop through all Invaders
			if (squad[i].alive) {																						// Only concerned with alive invaders
				/* Hit detection START */
				if (item.sx >= (squad[i].x - 4) && item.sx <= (squad[i].x + 9)) {
					if (item.sy >= (squad[i].y - 4) && item.sy <= (squad[i].y + 9)) {
				/* Hit detection END */
						score = score + 15;																				// We hit an invader, increase player score
						explodeShot(item.sx, item.sy, 8);																// Spawn an explision at shot location
						squad[i].alive = false;																			// Kill invader in invader array
						plr.shot.splice(index, 1);																		// Remove player shot from array
						ctx.fillStyle = "#ffffff";																		// WHITE
						ctx.fillRect(item.sx, item.sy, 5, 5);
						ctx.fillRect(item.sox, item.soy, 5, 5);
						ctx.fillRect(squad[i].x, squad[i].y, 10, 10);
						ctx.fillRect(squad[i].ox, squad[i].oy, 10, 10);
					}
				}
			}
		}
		if (boss.alive) {																								// If Boss is active on screen, we should check if we hit it.
			/* Hit detection START */
			if (item.sx >= (boss.x - 4) && item.sx <= (boss.x + 49)) {
				if (item.sy >= (boss.y - 4) && item.sy <= (boss.y + 19)) {
			/* Hit detection END */
					updateMessage({message:"E X C E L L E N T !", x:245, y:400}, 3000);									// Display message for being awesome
					score = score + 2500;																				// Increase player score
					explodeShot(item.sx, item.sy, 20);																	// Create explosion at shot location (BIG)
					boss.alive = false;																					// Kill boss
					plr.shot.splice(index, 1);																			// Remove player shot from array
					ctx.fillRect(item.sx, item.sy, 5, 5);
					ctx.fillRect(item.sox, item.soy, 5, 5);
					ctx.fillStyle = "#ffffff";																			// WHITE
					ctx.fillRect(boss.ox, boss.oy, 50, 20);
				}
			}
		}
	}
}

var displayShield = function() {
	ctx.fillStyle="#000000";																							// BLACK
	ctx.fillRect(588,758,204,34);
	var perc = parseInt(((200 / 1000) * plr.shield));																	// Calculate percentage of shield left, apply to width of 200px
	ctx.fillStyle="#00dddd";																							// CYAN
	ctx.fillRect(590,760,perc,30);
};

var displayScore = function() {
	ctx.fillStyle="#ffffff";																							// WHITE
	ctx.fillRect(10,760,550,30);
	ctx.fillStyle="#000000";																							// BLACK
	ctx.font = "26px Verdana";
	ctx.fillText("Score: " + score, 15, 785);
	ctx.fillText("Wave: " + wave, 310, 785);
}

var drawBoss = function() {
	if (boss.alive) {
		ctx.fillStyle = "#ffffff";																						// WHITE
		ctx.fillRect(boss.ox, boss.oy, 50, 20);
		ctx.fillStyle = "#ff0000";																						// RED
		ctx.fillRect(boss.x, boss.y, 50, 20);
		boss.ox = boss.x;
		boss.oy = boss.y;
		moveBoss();
	}
	boss.shot.forEach(enemyShot);																						// Call EnemyShot() for each shot boss has spawned (from moveBoss())
}

var moveBoss = function() {
	boss.x = boss.x + boss.dir;																							// Move boss on X position by direction speed.
	if ((boss.dir > 0 && boss.x > 745) || (boss.dir < 0 && boss.x < 10)) {												// If boss hits either boundary
		boss.alive = false;																								// Remove boss
		ctx.fillStyle = "#ffffff";																						// WHITE
		ctx.fillRect(boss.ox, boss.oy, 50, 20);
	}
	if (boss.x > 200 && boss.x < 600 && Math.random() > .9) {															// If boss is within inner target area and random number hits, trigger shot
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
		boss.shot.push(newShot);																						// Add new shot/bomb to boss shot array.
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

