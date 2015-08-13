
export class Human {

    constructor(npc, map) {
        this.LEFT = 1;
        this.RIGHT = 2;
        this.UP = 3;
        this.DOWN = 4;
        this.FLY = 5;
        this.RESPAWN_TIME = 300;
        
        this.npc = npc;
        this.map = map;
        this.pos = { x: 4, y: 20 };
        this.respawnPos = { x: 4, y: 4 };
        this.alive = false;
        this.direction = this.LEFT;
        this.keyFound = false;
        this.deathTimer = 0;
        this.finished = false;
    }

    kill() {
        this.alive = false;
    }

    isDead() {
        return !this.alive;
    }

    // Distance to other human.
    getDistance(otherHuman) {
        return Math.floor(Math.sqrt(Math.pow(this.pos.x - otherHuman.getPos().x, 2) + Math.pow(this.pos.y - otherHuman.getPos().y, 2)));
    }

    isKeyFound() {
        return this.keyFound;
    }

    caught(otherHuman) {
        return (this.getDistance(otherHuman) < 3);
    }

    resetKeyFound() {
        this.keyFound = false;
    }

    freeSquare(x, y) {
        var p = this.map.get(x, y),
            result = this.map.isSpace(p) || (p === this.map.LADDER) || (p === this.map.KLAD) || (p === this.map.KEY) ||
                (p === this.map.DOOR_OPENED) || (p === this.map.BRIDGE);

        if (!this.npc) {
            if (p === this.map.KLAD) {
                this.map.set(x, y, this.map.SPACE);
            }
            if (p === this.map.KEY) {
                this.keyFound = true;
                this.map.setKeyFound();
            }
            if ((p === this.map.DOOR) && this.keyFound) {
                this.map.set(x, y, this.map.DOOR_OPENED);
                result = true;
            }
            if (y < 0) {
                this.finished = true;
            }
        }

        if ((p === this.map.WATER) && (this.pos.y % 4) === 2) {
            this.kill();
        }

        return result;
    };

    getPos() {
        return this.pos;
    }

    moveLeft() {
        if (((this.pos.x % 4) === 0) && (!this.freeSquare(Math.floor(this.pos.x / 4) - 1, Math.floor((this.pos.y + 2) / 4)))) {
            return false;
        }
        if ((this.pos.y % 4) !== 0) {
            if ((this.pos.y % 4) > 1) {
                return this.moveDown();
            }
            return this.moveUp();
        }
        this.pos.x -= 1;
        this.direction = this.LEFT;
        return true;
    }

    moveRight() {
        if (((this.pos.x % 4) === 0) && (!this.freeSquare(Math.floor(this.pos.x / 4) + 1, Math.floor((this.pos.y + 2) / 4)))) {
            return false;
        }
        if ((this.pos.y % 4) !== 0) {
            if ((this.pos.y % 4) > 1) {
                return this.moveDown();
            }
            return this.moveUp();
        }
        this.pos.x += 1;
        this.direction = this.RIGHT;
        return true;
    }

    moveUp() {
        var x = Math.floor((this.pos.x + 2) / 4),
            y = Math.floor(this.pos.y / 4);
        if (((this.pos.y % 4) === 0) && (!(this.freeSquare(x, y - 1) && (this.map.get(x, y) === this.map.LADDER)))) {
            return false;
        }
        if ((this.pos.x % 4) !== 0) {
            if (!this.npc) {
                if ((this.pos.x % 4) > 1) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
            return false;
        }
        this.pos.y -= 1;
        this.direction = this.UP;
        return true;
    }

    moveDown() {
        if (((this.pos.y % 4) === 0) && (!this.freeSquare(Math.floor((this.pos.x + 2) / 4), Math.floor(this.pos.y / 4) + 1) ||
            (this.map.get(Math.floor((this.pos.x + 2) / 4), Math.floor(this.pos.y / 4) + 1) === this.map.BRIDGE))) {
            return false;
        }
        if ((this.pos.x % 4) !== 0) {
            if (!this.npc) {
                if ((this.pos.x % 4) > 1) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
            return false;
        }
        this.pos.y += 1;
        this.direction = this.DOWN;
        return true;
    }

    render(ctx, images) {

        var pic = 8,
            img,
            HUMAN_SPRITES = [images.runner0, images.runner1, images.runner2, images.runner3,
                images.runner4, images.runner5, images.runner6, images.runner7,
                images.runner8, images.runner9,
                images.runner10, images.runner11, images.runner12, images.runner13,
                images.runner14, images.runner15, images.runner16, images.runner17,
                images.runner18, images.runner19];

        if ((this.direction === this.LEFT) || (this.direction === this.RIGHT)) {
            pic = this.pos.x % 4;
        }
        if (this.direction === this.LEFT) {
            pic += 4;
        }
        if ((this.direction === this.UP) || (this.direction === this.DOWN)) {
            pic = (this.pos.y % 2) + 8;
        }
        if (this.npc) {
            pic += 10;
        }
        img = HUMAN_SPRITES[pic];

        ctx.drawImage(img, this.pos.x * (this.map.CELL_WIDTH / 4), this.pos.y * (this.map.CELL_HEIGHT / 4));
    }

    respawn(x, y) {
        this.respawnPos.x = x;
        this.respawnPos.y = y;
        this.pos.x = this.respawnPos.x * 4;
        this.pos.y = this.respawnPos.y * 4;
        this.alive = true;
        this.deathTimer = 0;
    }

    freeFly() {
        var x = Math.floor((this.pos.x + 2) / 4),
            y = Math.floor(this.pos.y / 4),
            p,
            flying;

        this.freeSquare(x, y + 1);
        if (this.map.get(x, y) === this.map.LADDER) {
            return false;
        }
        p = this.map.get(x, y + 1);
        flying = (this.map.isSpace(p) || (p === this.map.WATER) || ((p === this.map.BRIDGE) && (this.direction === this.FLY)));
        if (!flying) {
            return false;
        }

        if ((this.pos.x % 4) !== 0) {
            if ((this.pos.x % 4) > 1) {
                this.moveRight();
            } else {
                this.moveLeft();
            }
        } else {
            this.pos.y += 1;
        }

        this.direction = this.FLY;
        return true;
    }

    isFinished() {
        return this.finished;
    }

    resetFinished() {
        this.finished = false;
    }

    moveToHuman(otherHuman) {
        var toLeft = false,
            toRight = false,
            toUp = false,
            toDown = false;

        if (otherHuman.getPos().x < this.getPos().x) {
            toLeft = true;
        }
        if (otherHuman.getPos().x > this.getPos().x) {
            toRight = true;
        }
        if (otherHuman.getPos().y > this.getPos().y) {
            toDown = true;
        }
        if (otherHuman.getPos().y < this.getPos().y) {
            toUp = true;
        }

        this.move(toLeft, toRight, toUp, toDown);
    }

    move(toLeft, toRight, toUp, toDown) {
        if (this.npc) {
            if (!this.alive) {
                this.deathTimer += 1;
                if (this.deathTimer >= this.RESPAWN_TIME) {
                    this.respawn(this.respawnPos.x, this.respawnPos.y);
                }
                return false;
            }
        }

        if (this.freeFly()) {
            return false;
        }

        var moved = false;
        if (toLeft) {
            if (this.moveLeft()) {
                moved = true;
            }
        }
        if (toRight) {
            if (this.moveRight()) {
                moved = true;
            }
        }

        if (!moved) {
            if (toUp) {
                this.moveUp();
            }
            if (toDown) {
                this.moveDown();
            }
        }

        if (this.map.get(Math.floor((this.pos.x + 2) / 4), Math.floor((this.pos.y + 2) / 4)) === this.map.BRICK)
		{
            this.kill();
        }

        return true;
    }
}
