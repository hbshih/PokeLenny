import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import gameState from '../GameState';

export class Overworld extends Scene
{
    constructor ()
    {
        super('Overworld');
        this.moveDelay = 200;
        this.lastMoveTime = 0;
        this.npcs = [];
        this.battleNPC = null;
        this.nearestNPC = null;
        this.playerName = 'Player';
        this.playerNameText = null;
        this.currentMap = 'large-map'; // Track current map (use large map by default)
        this.mapTransitions = []; // Store transition zones
        this.battleActive = false; // Track if battle is active to disable input
    }

    init (data)
    {
        // Receive player name from MainMenu
        if (data.playerName) {
            this.playerName = data.playerName;
        }

        // Handle map transitions
        if (data.map) {
            this.currentMap = data.map;
        }

        // Set spawn position if transitioning
        if (data.spawnX !== undefined && data.spawnY !== undefined) {
            this.spawnX = data.spawnX;
            this.spawnY = data.spawnY;
        } else {
            this.spawnX = 6;
            this.spawnY = 4;
        }
    }

    create ()
    {
        // Clean up any DOM elements from previous scenes
        const existingInput = document.getElementById('player-name-input');
        if (existingInput) {
            existingInput.remove();
        }

        // Load map (default or specified map)
        const map = this.make.tilemap({ key: this.currentMap });

        // The tileset name in the JSON is "tuxmon-sample-32px-extruded", and we loaded it as "tiles"
        const tileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tiles');

        // Create layers from tilemap
        const belowLayer = map.createLayer('Below Player', tileset);
        const worldLayer = map.createLayer('World', tileset);
        const aboveLayer = map.createLayer('Above Player', tileset);

        // Set collision on World layer
        worldLayer.setCollisionByProperty({ collides: true });

        // Create player at starting or spawn position
        this.player = {
            sprite: null,
            tileX: this.spawnX,
            tileY: this.spawnY,
            direction: 'down'
        };

        // Store map and layer references (before creating NPCs)
        this.map = map;
        this.worldLayer = worldLayer;
        this.belowLayer = belowLayer;

        this.createPlayer();

        // Create NPCs/Guests
        this.createNPCs();

        // Set layer depths
        aboveLayer.setDepth(10);
        this.player.sprite.setDepth(5);

        // Set up main camera with less zoom to see more of the map
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player.sprite, true, 0.09, 0.09);
        this.cameras.main.setZoom(1.2); // Slightly zoomed out to see more area

        // Create minimap in bottom-right corner (200x200 pixels)
        const minimapSize = 200;
        const minimapPadding = 10;
        const minimapX = this.scale.width - minimapSize - minimapPadding;
        const minimapY = this.scale.height - minimapSize - minimapPadding;

        this.minimap = this.cameras.add(minimapX, minimapY, minimapSize, minimapSize)
            .setZoom(0.15) // Show more of the map
            .setName('minimap')
            .setBackgroundColor(0x002b36)
            .setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        // Make minimap follow player smoothly
        this.minimap.startFollow(this.player.sprite, false, 0.1, 0.1);

        // Add styled border to minimap
        this.minimapBorder = this.add.graphics();
        this.minimapBorder.lineStyle(4, 0xFFD700, 1); // Gold border
        this.minimapBorder.strokeRect(minimapX - 2, minimapY - 2, minimapSize + 4, minimapSize + 4);
        this.minimapBorder.setScrollFactor(0);
        this.minimapBorder.setDepth(1000);

        // Add minimap label
        this.add.text(minimapX + 5, minimapY + 5, 'MAP', {
            fontSize: '10px',
            fontFamily: 'Press Start 2P, monospace',
            color: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(1001);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,C,SPACE,ENTER');

        // Listen for battle start - disable input during battle
        EventBus.on('start-battle', () => {
            this.battleActive = true;
        });

        // Listen for battle end - re-enable input
        EventBus.on('battle-ended', () => {
            this.battleActive = false;
        });

        // Listen for battle rejection
        EventBus.on('battle-rejected', () => {
            if (this.battleNPC) {
                this.battleNPC.challenged = false;
                this.battleNPC = null;
            }
            this.battleActive = false;
        });

        // Listen for player name (stored but not displayed)
        EventBus.on('player-name-set', (name) => {
            this.playerName = name || 'Player';
        });

        EventBus.emit('current-scene-ready', this);
    }

    createPlayer ()
    {
        const px = this.player.tileX * 32 + 16;
        const py = this.player.tileY * 32 + 16;

        this.player.sprite = this.add.sprite(px, py, 'main-front');
        this.player.sprite.setScale(0.15); // Smaller character to match zoom
        this.player.sprite.setDepth(10);
    }

    createNPCs ()
    {
        // Generate NPCs distributed across the map
        // For large map: place NPCs on path tiles (every 8 tiles in grid pattern)
        const isLargeMap = this.currentMap === 'large-map';

        if (isLargeMap) {
            // Place NPCs throughout the city with better spacing
            const maxNPCs = 150; // Reduced from 300 for better performance/visibility
            const mapWidth = this.map.width;
            const mapHeight = this.map.height;

            const guestNames = [
                'Elena Verna', 'Shreyas Doshi', 'Lenny Rachitsky',
                'Casey Winters', 'Nir Eyal', 'Julie Zhuo',
                'Des Traynor', 'April Dunford', 'Marty Cagan'
            ];

            let npcCount = 0;
            const minSpacing = 7; // Increased spacing for less crowding

            // Distribute NPCs across the map, checking for walkable tiles
            for (let y = 8; y < mapHeight - 8 && npcCount < maxNPCs; y += minSpacing) {
                for (let x = 8; x < mapWidth - 8 && npcCount < maxNPCs; x += minSpacing) {
                    // Check if this tile is walkable (no collision)
                    const tile = this.worldLayer.getTileAt(x, y);
                    if (!tile || !tile.collides) {
                        const guestId = String(npcCount + 1);
                        const guestName = guestNames[npcCount % guestNames.length] + ` #${Math.floor(npcCount / guestNames.length) + 1}`;

                        const npc = {
                            id: guestId,
                            name: guestName,
                            tileX: x,
                            tileY: y,
                            direction: ['down', 'up', 'left', 'right'][npcCount % 4],
                            sprite: null,
                            challenged: false
                        };

                        // Create NPC sprite
                        let sprite;
                        if (npcCount === 0) {
                            // First NPC uses Elena sprite
                            sprite = this.add.sprite(
                                x * 32 + 16,
                                y * 32 + 16,
                                'elena-front'
                            );
                            sprite.setScale(0.15);
                        } else {
                            // Color-coded placeholders for different guests
                            const colors = [0xFF69B4, 0x87CEEB, 0x98D982, 0xFFD700, 0xFF6B6B, 0x9B59B6];
                            sprite = this.add.rectangle(
                                x * 32 + 16,
                                y * 32 + 16,
                                20, 20,
                                colors[npcCount % colors.length]
                            );
                            sprite.setStrokeStyle(2, 0x000000);
                        }
                        sprite.setDepth(5);

                        // Check if NPC is already defeated
                        const isDefeated = gameState.isGuestDefeated(guestId);
                        if (isDefeated) {
                            sprite.setAlpha(0.4);
                            // Apply grey tint - different methods for sprites vs rectangles
                            if (sprite.setTint) {
                                sprite.setTint(0x888888); // Grey tint for sprites
                            } else if (sprite.setFillStyle) {
                                sprite.setFillStyle(0x888888); // Grey fill for rectangles
                                sprite.setStrokeStyle(2, 0x555555); // Darker stroke for defeated
                            }
                            npc.challenged = true; // Mark as already challenged
                        }

                        npc.sprite = sprite;
                        npc.defeated = isDefeated;
                        this.npcs.push(npc);
                        npcCount++;
                    }
                }
            }

            console.log(`Created ${npcCount} NPCs across the city`);
        } else {
            // Small map - original 3 NPCs
            const guestData = [
                { id: '1', name: 'Elena Verna', x: 10, y: 8, direction: 'down' },
                { id: '2', name: 'Shreyas Doshi', x: 15, y: 12, direction: 'right' },
                { id: '3', name: 'Lenny Rachitsky', x: 5, y: 6, direction: 'left' }
            ];

            guestData.forEach(data => {
                const npc = {
                    id: data.id,
                    name: data.name,
                    tileX: data.x,
                    tileY: data.y,
                    direction: data.direction,
                    sprite: null,
                    challenged: false
                };

                let sprite;
                if (data.id === '1') {
                    sprite = this.add.sprite(
                        data.x * 32 + 16,
                        data.y * 32 + 16,
                        'elena-front'
                    );
                    sprite.setScale(0.15);
                } else {
                    sprite = this.add.rectangle(
                        data.x * 32 + 16,
                        data.y * 32 + 16,
                        20, 20,
                        0xFF69B4
                    );
                    sprite.setStrokeStyle(2, 0x000000);
                }
                sprite.setDepth(5);

                // Check if NPC is already defeated
                const isDefeated = gameState.isGuestDefeated(data.id);
                if (isDefeated) {
                    sprite.setAlpha(0.4);
                    sprite.setTint(0x888888); // Grey tint
                    npc.challenged = true; // Mark as already challenged
                }

                npc.sprite = sprite;
                npc.defeated = isDefeated;
                this.npcs.push(npc);
            });
        }
    }

    update (time)
    {
        // Disable all input during battle
        if (this.battleActive) {
            return;
        }

        if (time - this.lastMoveTime < this.moveDelay) {
            return;
        }

        let dx = 0;
        let dy = 0;

        if (this.cursors.up.isDown || this.keys.W.isDown) {
            dy = -1;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            dy = 1;
        } else if (this.cursors.left.isDown || this.keys.A.isDown) {
            dx = -1;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.movePlayer(dx, dy);
            this.lastMoveTime = time;
        }

        // Update interaction prompt
        this.updateInteractionPrompt();

        // Check for NPC interaction
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
            Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
            this.checkNPCInteraction();
        }

        // Collection hotkey
        if (Phaser.Input.Keyboard.JustDown(this.keys.C)) {
            EventBus.emit('open-collection');
        }
    }

    updateInteractionPrompt ()
    {
        // Check for NPCs within 5 tile range
        const interactionRange = 5;
        let nearestNPC = null;
        let nearestDistance = Infinity;

        this.npcs.forEach(npc => {
            if (!npc.challenged) {
                const dx = Math.abs(npc.tileX - this.player.tileX);
                const dy = Math.abs(npc.tileY - this.player.tileY);
                const distance = dx + dy; // Manhattan distance

                if (distance <= interactionRange && distance < nearestDistance) {
                    nearestNPC = npc;
                    nearestDistance = distance;
                }
            }
        });

        if (nearestNPC) {
            // Store nearest NPC and emit event to show encounter dialog
            if (!this.nearestNPC || this.nearestNPC.id !== nearestNPC.id) {
                this.nearestNPC = nearestNPC;
                EventBus.emit('show-encounter-dialog', {
                    id: nearestNPC.id,
                    name: nearestNPC.name,
                    sprite: nearestNPC.sprite,
                    episode: 'Product Knowledge'
                });
            }
        } else {
            // Clear nearest NPC and hide dialog
            if (this.nearestNPC) {
                this.nearestNPC = null;
                EventBus.emit('hide-encounter-dialog');
            }
        }
    }

    movePlayer (dx, dy)
    {
        const newX = this.player.tileX + dx;
        const newY = this.player.tileY + dy;

        // Check for map transitions at edges
        if (newX < 0) {
            this.transitionMap('west', newX, newY);
            return;
        } else if (newX >= this.map.width) {
            this.transitionMap('east', newX, newY);
            return;
        } else if (newY < 0) {
            this.transitionMap('north', newX, newY);
            return;
        } else if (newY >= this.map.height) {
            this.transitionMap('south', newX, newY);
            return;
        }

        if (this.isWalkable(newX, newY)) {
            this.player.tileX = newX;
            this.player.tileY = newY;

            // Update direction and sprite
            if (dy < 0) {
                this.player.direction = 'up';
                this.player.sprite.setTexture('main-back');
            } else if (dy > 0) {
                this.player.direction = 'down';
                this.player.sprite.setTexture('main-front');
            } else if (dx < 0) {
                this.player.direction = 'left';
                this.player.sprite.setTexture('main-right');
            } else if (dx > 0) {
                this.player.direction = 'right';
                this.player.sprite.setTexture('main-left');
            }

            this.tweens.add({
                targets: this.player.sprite,
                x: newX * 32 + 16,
                y: newY * 32 + 16,
                duration: this.moveDelay - 50,
                ease: 'Linear'
            });
        }
    }

    transitionMap (direction, attemptedX, attemptedY)
    {
        // Map connections - defines which maps connect to which
        const mapConnections = {
            'map': {
                north: null,
                south: null,
                east: null,
                west: null
            }
        };

        const connection = mapConnections[this.currentMap]?.[direction];
        if (!connection) {
            // No connection in this direction, block movement
            return;
        }

        // Calculate spawn position on new map
        let spawnX, spawnY;
        switch (direction) {
            case 'north':
                spawnX = this.player.tileX;
                spawnY = this.map.height - 2;
                break;
            case 'south':
                spawnX = this.player.tileX;
                spawnY = 1;
                break;
            case 'west':
                spawnX = this.map.width - 2;
                spawnY = this.player.tileY;
                break;
            case 'east':
                spawnX = 1;
                spawnY = this.player.tileY;
                break;
        }

        // Store new position and restart scene with new map
        this.scene.restart({
            playerName: this.playerName,
            map: connection,
            spawnX: spawnX,
            spawnY: spawnY
        });
    }

    checkNPCInteraction ()
    {
        // Use the nearestNPC that's already tracked
        if (this.nearestNPC) {
            this.nearestNPC.challenged = true;
            this.battleNPC = this.nearestNPC;
            // Hide the encounter dialog and start battle directly
            EventBus.emit('hide-encounter-dialog');
            EventBus.emit('start-battle', { guestId: this.nearestNPC.id, guestName: this.nearestNPC.name });
        }
    }

    isWalkable (x, y)
    {
        if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
            return false;
        }

        // Check for NPCs
        if (this.npcs.some(npc => npc.tileX === x && npc.tileY === y)) {
            return false;
        }

        const tile = this.worldLayer.getTileAt(x, y);
        return !tile || !tile.collides;
    }
}
