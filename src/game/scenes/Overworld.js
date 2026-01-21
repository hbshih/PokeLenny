import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Overworld extends Scene
{
    constructor ()
    {
        super('Overworld');
        this.moveDelay = 200;
        this.lastMoveTime = 0;
        this.npcs = [];
        this.battleNPC = null;
        this.interactionPrompt = null;
        this.playerName = 'Player';
        this.playerNameText = null;
    }

    init (data)
    {
        // Receive player name from MainMenu
        if (data.playerName) {
            this.playerName = data.playerName;
        }
    }

    create ()
    {
        // Load working tuxemon town map
        const map = this.make.tilemap({ key: 'map' });

        // The tileset name in the JSON is "tuxmon-sample-32px-extruded", and we loaded it as "tiles"
        const tileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tiles');

        // Create layers from tilemap
        const belowLayer = map.createLayer('Below Player', tileset);
        const worldLayer = map.createLayer('World', tileset);
        const aboveLayer = map.createLayer('Above Player', tileset);

        // Set collision on World layer
        worldLayer.setCollisionByProperty({ collides: true });

        // Create player at starting position
        this.player = {
            sprite: null,
            tileX: 6,
            tileY: 4,
            direction: 'down'
        };

        this.createPlayer();

        // Create NPCs/Guests
        this.createNPCs();

        // Set layer depths
        aboveLayer.setDepth(10);
        this.player.sprite.setDepth(5);

        // Store map and layer references
        this.map = map;
        this.worldLayer = worldLayer;
        this.belowLayer = belowLayer;

        // Set up main camera with less zoom to see more of the map
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player.sprite, true, 0.09, 0.09);
        this.cameras.main.setZoom(1.3); // Zoomed out to see more area

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

        // Listen for battle rejection
        EventBus.on('battle-rejected', () => {
            if (this.battleNPC) {
                this.battleNPC.challenged = false;
                this.battleNPC = null;
            }
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
        // Guest data with positions (for tuxemon-town map)
        const guestData = [
            { id: '1', name: 'Elena Verna', x: 10, y: 8, direction: 'down' },       // In town
            { id: '2', name: 'Shreyas Doshi', x: 15, y: 12, direction: 'right' },   // East side
            { id: '3', name: 'Lenny Rachitsky', x: 5, y: 6, direction: 'left' }     // West side
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

            // Create NPC sprite
            let sprite;
            if (data.id === '1') {
                // Elena Verna - use front sprite
                sprite = this.add.sprite(
                    data.x * 32 + 16,
                    data.y * 32 + 16,
                    'elena-front'
                );
                sprite.setScale(0.15); // Smaller to match main character
            } else {
                // Placeholder for other NPCs
                sprite = this.add.rectangle(
                    data.x * 32 + 16,
                    data.y * 32 + 16,
                    20, 20,
                    0xFF69B4
                );
                sprite.setStrokeStyle(2, 0x000000);
            }
            sprite.setDepth(5);

            npc.sprite = sprite;
            this.npcs.push(npc);
        });
    }

    update (time)
    {
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
        // Check for NPCs within 3 tile range
        const interactionRange = 3;
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
            // Show prompt if not already visible
            if (!this.interactionPrompt) {
                this.interactionPrompt = this.add.text(
                    this.player.sprite.x,
                    this.player.sprite.y - 30,
                    'Click SPACE to fight',
                    {
                        fontSize: '8px',
                        fontFamily: 'Press Start 2P, monospace',
                        color: '#FFFFFF',
                        backgroundColor: '#000000',
                        padding: { x: 6, y: 4 }
                    }
                );
                this.interactionPrompt.setOrigin(0.5);
                this.interactionPrompt.setDepth(20);
            }
            // Update prompt position
            this.interactionPrompt.setPosition(this.player.sprite.x, this.player.sprite.y - 30);
        } else {
            // Hide prompt
            if (this.interactionPrompt) {
                this.interactionPrompt.destroy();
                this.interactionPrompt = null;
            }
        }
    }

    movePlayer (dx, dy)
    {
        const newX = this.player.tileX + dx;
        const newY = this.player.tileY + dy;

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

    checkNPCInteraction ()
    {
        // Check for NPCs within 3 tile range
        const interactionRange = 3;
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
            nearestNPC.challenged = true;
            this.battleNPC = nearestNPC;
            EventBus.emit('start-battle', { guestId: nearestNPC.id, guestName: nearestNPC.name });
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
