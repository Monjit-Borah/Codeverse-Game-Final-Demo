window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 500;

    // 1. INPUT HANDLER
    class InputHandler {
        constructor(game) {
            this.game = game;
            window.addEventListener('keydown', e => {
                if (this.game.music.paused) {
                    this.game.music.play().catch(error => console.log("Audio waiting for interaction"));
                }
                if (((e.key === 'ArrowUp') || (e.key === 'ArrowDown')) && this.game.keys.indexOf(e.key) === -1) {
                    this.game.keys.push(e.key);
                } else if (e.key === ' ') {
                    this.game.player.shootTop();
                } else if (e.key === 'd') {
                    this.game.debug = !this.game.debug;
                }
            });
            window.addEventListener('keyup', e => {
                if (this.game.keys.indexOf(e.key) > -1) {
                    this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    // 2. PROJECTILE
    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 3;
            this.markedForDeletion = false;
            this.image = document.getElementById('projectile');
        }
        update() {
            this.x += this.speed;
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
        }
        draw(context) {
            if (this.image && this.image.complete) {
                context.drawImage(this.image, this.x, this.y);
            } else {
                context.fillStyle = 'yellow';
                context.fillRect(this.x, this.y, this.width, this.height);
            }
        }
    }

    // 3. PARTICLE
    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('gears');
            this.frameX = Math.floor(Math.random() * 3);
            this.frameY = Math.floor(Math.random() * 3);
            this.spriteSize = 50;
            this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random() * 0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random() * 80 + 60;
        }
        update() {
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if (this.y > this.game.height + this.size || this.x < 0 - this.size) this.markedForDeletion = true;
            
            if (this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 2) {
                this.bounced++;
                this.speedY *= -0.7;
            }
        }
        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            if (this.image && this.image.complete) {
                context.drawImage(this.image, 
                    this.frameX * this.spriteSize, this.frameY * this.spriteSize, 
                    this.spriteSize, this.spriteSize, 
                    -this.size * 0.5, -this.size * 0.5, 
                    this.size, this.size);
            } else {
                context.fillStyle = 'gold';
                context.fillRect(0,0, this.size, this.size);
            }
            context.restore();
        }
    }

    // 4. PLAYER
    class Player {
        constructor(game) {
            this.game = game;
            this.width = 120; 
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.speedY = 0;
            this.maxSpeed = 3;
            this.projectiles = [];
            this.image = document.getElementById('player');
            this.frameX = 0;
            this.frameY = 0; 
            this.maxFrame = 37;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 350;
        }
        update(deltaTime) {
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            
            this.y += this.speedY;
            
            if (this.y > this.game.height - this.height * 0.5) this.y = this.game.height - this.height * 0.5;
            else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;

            this.projectiles.forEach(projectile => projectile.update());
            this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = 0;

            if (this.ammo < this.maxAmmo) {
                if (this.ammoTimer > this.ammoInterval) {
                    this.ammo++;
                    this.ammoTimer = 0;
                } else {
                    this.ammoTimer += deltaTime;
                }
            }
        }
        draw(context) {
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => projectile.draw(context));
            
            if (this.image && this.image.complete) {
                context.drawImage(this.image, 
                    this.frameX * this.width, this.frameY * this.height, 
                    this.width, this.height, 
                    this.x, this.y, 
                    this.width, this.height);
            } else {
                context.fillStyle = 'green';
                context.fillRect(this.x, this.y, this.width, this.height);
            }
        }
        shootTop() {
            if (this.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
                this.ammo--;
            }
        }
    }

    // 5. ENEMIES
    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5;
            this.markedForDeletion = false;
            
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 0;

            this.dying = false;
            this.dyingTimer = 0;
            this.dyingDuration = 50; 
            this.burnImage = document.getElementById('fireExplosion');
        }
        update() {
            if (this.dying) {
                this.x += Math.random() * 10 - 5; 
                this.y += Math.random() * 10 - 5;
                this.dyingTimer++;
                if (this.dyingTimer > this.dyingDuration) {
                    this.markedForDeletion = true;
                    this.game.addExplosion(this);
                }
                return;
            }

            this.x += this.speedX - this.game.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
        }
        draw(context) {
            if (this.game.debug) {
                context.strokeRect(this.x, this.y, this.width, this.height);
                context.font = '20px Helvetica';
                context.fillText(this.lives, this.x, this.y);
            }
            
            if (this.image && this.image.complete && this.image.naturalWidth > 0) {
                context.drawImage(this.image, 
                    0, 0, this.image.naturalWidth, this.image.naturalHeight, 
                    this.x, this.y, 
                    this.width, this.height);
            } else {
                context.fillStyle = 'red';
                context.fillRect(this.x, this.y, this.width, this.height);
                context.fillStyle = 'white';
                context.font = '15px Arial';
                context.fillText('No Img', this.x, this.y + 20);
            }

            if (this.dying && this.burnImage && this.burnImage.complete) {
                let fireFrame = Math.floor(Math.random() * 8);
                context.drawImage(this.burnImage,
                    fireFrame * 200, 0, 200, 200,
                    this.x, this.y, 
                    this.width, this.height
                );
            }
        }
        
        startDying() {
            if (!this.dying) {
                this.dying = true;
                this.lives = 0; 
            }
        }
    }
    
    // Angler1 -> enemy1
    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 100;
            this.height = 100;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('enemy1'); 
            this.lives = 5;
            this.score = 5;
        }
    }
    // Angler2 -> enemy2
    class Angler2 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 120;
            this.height = 120;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('enemy2'); 
            this.lives = 6;
            this.score = 6;
        }
    }
    // HiveWhale -> enemy2
    class HiveWhale extends Enemy {
        constructor(game) {
            super(game);
            this.width = 150;
            this.height = 150;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = document.getElementById('enemy2'); 
            this.lives = 20;
            this.score = 20;
            this.type = 'hive';
            this.speedX = Math.random() * -1.2 - 0.2;
        }
    }
    class Drone extends Enemy {
        constructor(game, x, y) {
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = x;
            this.y = y;
            this.image = document.getElementById('drone'); 
            this.lives = 3;
            this.score = 3;
            this.type = 'drone';
            this.speedX = Math.random() * -4.2 - 0.5;
        }
    }

    // 6. BACKGROUND & LAYERS
    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        update() {
            if (this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }
        draw(context) {
            if (this.image && this.image.complete) {
                context.drawImage(this.image, this.x, this.y);
                context.drawImage(this.image, this.x + this.width, this.y);
            }
        }
    }
    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = document.getElementById('layer1');
            this.image2 = document.getElementById('layer2');
            this.image3 = document.getElementById('layer3');
            this.image4 = document.getElementById('layer4');
            this.layer1 = new Layer(this.game, this.image1, 0.2);
            this.layer2 = new Layer(this.game, this.image2, 0.4);
            this.layer3 = new Layer(this.game, this.image3, 1);
            this.layer4 = new Layer(this.game, this.image4, 1.5);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        update() {
            this.layers.forEach(layer => layer.update());
        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    // 7. EXPLOSIONS
    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.frameX = 0;
            this.spriteHeight = 200;
            this.spriteWidth = 200;
            this.fps = 15;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime) {
            this.x -= this.game.speed;
            if (this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if (this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context) {
            if (this.image && this.image.complete) {
                context.drawImage(this.image, 
                    this.frameX * this.spriteWidth, 0, 
                    this.spriteWidth, this.spriteHeight, 
                    this.x, this.y, 
                    this.width, this.height);
            }
        }
    }
    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = document.getElementById('fireExplosion');
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
        }
    }

    // 8. UI
    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.color = 'white';
        }
        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;
            
            // Score
            context.fillText('Score: ' + this.game.score, 20, 40);
            
            // Timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer: ' + formattedTime, 20, 100);

            // Ammo
            if (this.game.player.ammo > 0) {
                for (let i = 0; i < this.game.player.ammo; i++) {
                    context.fillRect(20 + 5 * i, 50, 3, 20);
                }
            }

            // Game Over
            if (this.game.gameOver) {
                context.textAlign = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore) {
                    message1 = 'MOST WONDERS!';
                    message2 = 'Well done explorer!';
                } else {
                    message1 = 'BLAZES!';
                    message2 = 'Get my repair kit and try again!';
                }
                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
            }
            context.restore();
        }
    }

    // 9. MAIN GAME CLASS
    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.enemyTimer = 0;
            this.enemyInterval = 2000;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.score = 0;
            this.winningScore = 80;
            this.gameTime = 0;
            this.timeLimit = 30000;
            this.speed = 1;
            this.gameOver = false;
            this.debug = false;
            
            this.music = new Audio('./assets/music.mp3'); 
            this.music.loop = true;
            this.music.volume = 0.5; 
        }
        update(deltaTime) {
            if (!this.gameOver) this.gameTime += deltaTime;
            if (this.gameTime > this.timeLimit) this.gameOver = true;

            this.background.update();
            this.background.layer4.update();
            this.player.update(deltaTime);
            
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }

            this.particles.forEach(particle => particle.update());
            this.particles = this.particles.filter(particle => !particle.markedForDeletion);

            this.explosions.forEach(explosion => explosion.update(deltaTime));
            this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);

            this.enemies.forEach(enemy => {
                enemy.update();
                
                // PLAYER COLLISION
                if (this.checkCollision(this.player, enemy) && !enemy.dying) {
                    enemy.startDying();
                    for (let i = 0; i < enemy.score; i++) {
                         this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
                    }
                    if (enemy.type === 'hive') {
                        for (let i = 0; i < 5; i++) {
                            this.enemies.push(new Drone(this, enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height * 0.5));
                        }
                    }
                    if (!this.gameOver) this.score--;
                }

                // PROJECTILE COLLISION
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollision(projectile, enemy) && !enemy.dying) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        this.particles.push(new Particle(this, enemy.x + enemy.width*0.5, enemy.y + enemy.height*0.5));
                        
                        if (enemy.lives <= 0) {
                            enemy.startDying();
                            if (enemy.type === 'hive') {
                                for (let i = 0; i < 5; i++) {
                                    this.enemies.push(new Drone(this, enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height * 0.5));
                                }
                            }
                            if (!this.gameOver) this.score += enemy.score;
                        }
                    }
                })
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }
        draw(context) {
            this.background.draw(context);
            this.ui.draw(context);
            this.player.draw(context);
            this.particles.forEach(particle => particle.draw(context));
            this.enemies.forEach(enemy => enemy.draw(context));
            this.explosions.forEach(explosion => explosion.draw(context));
            this.background.layer4.draw(context);
        }
        addEnemy() {
            const randomize = Math.random();
            if (randomize < 0.3) this.enemies.push(new Angler1(this));
            else if (randomize < 0.6) this.enemies.push(new Angler2(this));
            else this.enemies.push(new HiveWhale(this));
        }
        addExplosion(enemy) {
            this.explosions.push(new FireExplosion(this, enemy.x + enemy.width * 0.5 - 100, enemy.y + enemy.height * 0.5 - 100));
        }
        checkCollision(rect1, rect2) {
            return (    rect1.x < rect2.x + rect2.width &&
                        rect1.x + rect1.width > rect2.x &&
                        rect1.y < rect2.y + rect2.height &&
                        rect1.height + rect1.y > rect2.y);
        }
        restart() {
            this.score = 0;
            this.gameTime = 0;
            this.gameOver = false;
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.player.x = 20;
            this.player.y = 100;
            this.player.ammo = 20;
            this.player.projectiles = [];
        }
    }

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        
        if (deltaTime > 1000) {
           requestAnimationFrame(animate);
           return; 
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        if (!game.gameOver) requestAnimationFrame(animate);
    }
    animate(0);

    // FIXED RESTART LOGIC
    const restartBtn = document.getElementById('restartBtn');
    restartBtn.addEventListener('click', () => {
        // 1. Capture the state BEFORE resetting
        const wasGameOver = game.gameOver;
        
        // 2. Reset Game
        game.restart();
        
        // 3. Reset Time Tracker to avoid jumps
        lastTime = performance.now();
        
        // 4. Restart Music
        if (game.music.paused) {
            game.music.play().catch(e => console.log(e));
        }
        
        // 5. If the game loop had stopped, restart it now.
        if (wasGameOver) {
            animate(performance.now());
        }
    });
});