import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import gameState from '../GameState';
import guestDataManager from '../GuestData';
import { getStageOpponents, getTotalStages } from '../StageConfig';

const WORLD_CONFIGS = [
    {
        key: 'large-map',
        tilesetName: 'tuxmon-sample-32px-extruded',
        tilesKey: 'tiles',
        layers: {
            below: 'Below Player',
            world: 'World',
            above: 'Above Player'
        },
        segmentWidth: 40
    },
    {
        key: 'desert-map',
        tilesetName: 'Desert',
        tilesKey: 'desert-tiles',
        layers: {
            below: 'Ground',
            world: 'Ground',
            above: null
        },
        segmentWidth: null
    }
];

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
        this.segmentsPerWorld = 3;
        this.currentWorld = 0;
        this.currentMap = WORLD_CONFIGS[this.currentWorld].key;
        this.mapTransitions = []; // Store transition zones
        this.battleActive = false; // Track if battle is active to disable input
        this.music = null;
        this.battleMusic = null;
        this.victorySound = null;
        this.spawnedGuestIndices = []; // Track which guests have been spawned
        this.currentLevel = 1;
        this.unlockedLevel = 1;
        this.currentSegment = 0;
        this.segmentHeight = 40;
        this.segmentWidth = 40;
        this.totalSegments = 1;
    }

    init (data)
    {
        // Receive player name from MainMenu
        if (data.playerName) {
            this.playerName = data.playerName;
        }

        // Handle map transitions
        if (typeof data.worldIndex === 'number') {
            this.currentWorld = data.worldIndex;
        }
        if (typeof data.segmentIndex === 'number') {
            this.currentSegment = data.segmentIndex;
        }
        if (typeof data.level === 'number') {
            this.currentLevel = data.level;
        }
        if (typeof data.unlockedLevel === 'number') {
            this.unlockedLevel = data.unlockedLevel;
        }
        if (data.map) {
            this.currentMap = data.map;
        } else {
            this.currentMap = WORLD_CONFIGS[this.currentWorld]?.key || 'large-map';
        }

        if (!this.isWorldAvailable(this.currentWorld)) {
            console.warn('World assets missing, falling back to large-map');
            this.currentWorld = 0;
            this.currentMap = WORLD_CONFIGS[0].key;
            this.currentSegment = 0;
            this.currentLevel = Math.max(1, this.currentLevel || 1);
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
        // Reset scene state on (re)entry to avoid stale NPC data
        this.npcs = [];
        this.nearestNPC = null;
        this.battleNPC = null;
        this.spawnedGuestIndices = [];
        if (!this.currentLevel) this.currentLevel = 1;
        if (!this.unlockedLevel) this.unlockedLevel = 1;
        if (!this.currentSegment) this.currentSegment = 0;

        // Clean up any DOM elements from previous scenes
        const existingInput = document.getElementById('player-name-input');
        if (existingInput) {
            existingInput.remove();
        }

        // Load map (default or specified map)
        const mapData = this.cache.tilemap.get(this.currentMap);
        if (!mapData || !this.cache.tilemap.exists(this.currentMap)) {
            console.warn(`Map key "${this.currentMap}" not found. Falling back to large-map.`);
            this.currentWorld = 0;
            this.currentMap = WORLD_CONFIGS[0].key;
            this.currentSegment = 0;
            this.currentLevel = 1;
        }
        const map = this.make.tilemap({ key: this.currentMap });
        const worldConfig = WORLD_CONFIGS[this.currentWorld] || WORLD_CONFIGS[0];

        if (!this.textures.exists(worldConfig.tilesKey)) {
            console.warn(`Tileset "${worldConfig.tilesKey}" missing. Falling back to large-map.`);
            this.currentWorld = 0;
            this.currentMap = WORLD_CONFIGS[0].key;
            this.currentSegment = 0;
            this.currentLevel = 1;
            return this.scene.restart({
                playerName: this.playerName,
                map: this.currentMap,
                worldIndex: this.currentWorld,
                segmentIndex: this.currentSegment,
                level: this.currentLevel,
                unlockedLevel: this.unlockedLevel,
                spawnX: this.spawnX,
                spawnY: this.spawnY
            });
        }
        const tileset = map.addTilesetImage(worldConfig.tilesetName, worldConfig.tilesKey);
        if (!tileset) {
            console.warn(`Tileset "${worldConfig.tilesetName}" not found in map "${this.currentMap}". Falling back to large-map.`);
            this.currentWorld = 0;
            this.currentMap = WORLD_CONFIGS[0].key;
            return this.scene.restart({
                playerName: this.playerName,
                map: this.currentMap,
                worldIndex: this.currentWorld,
                segmentIndex: 0,
                level: 1,
                unlockedLevel: this.unlockedLevel,
                spawnX: this.spawnX,
                spawnY: this.spawnY
            });
        }

        const layerNames = map.layers?.map(layer => layer.name) || [];
        const resolveLayerName = (preferred) => {
            if (preferred && layerNames.includes(preferred)) return preferred;
            return layerNames[0] || null;
        };

        let belowLayerName = resolveLayerName(worldConfig.layers.below);
        const worldLayerName = resolveLayerName(worldConfig.layers.world);
        const aboveLayerName = worldConfig.layers.above && layerNames.includes(worldConfig.layers.above) ? worldConfig.layers.above : null;

        if (belowLayerName && belowLayerName === worldLayerName) {
            belowLayerName = null;
        }

        const belowLayer = belowLayerName ? map.createLayer(belowLayerName, tileset) : null;
        const worldLayer = worldLayerName ? map.createLayer(worldLayerName, tileset) : null;
        const aboveLayer = aboveLayerName ? map.createLayer(aboveLayerName, tileset) : null;

        if (!worldLayer) {
            console.warn(`World layer not found for map "${this.currentMap}". Falling back to large-map.`);
            this.currentWorld = 0;
            this.currentMap = WORLD_CONFIGS[0].key;
            return this.scene.restart({
                playerName: this.playerName,
                map: this.currentMap,
                worldIndex: this.currentWorld,
                segmentIndex: 0,
                level: 1,
                unlockedLevel: this.unlockedLevel,
                spawnX: this.spawnX,
                spawnY: this.spawnY
            });
        }

        // Set collision on World layer
        if (worldLayer) {
            worldLayer.setCollisionByProperty({ collides: true });
        }

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
        this.segmentHeight = Math.max(1, Math.floor(this.map.height / this.segmentsPerWorld));
        this.segmentWidth = worldConfig.segmentWidth || this.map.width;
        this.totalSegments = this.segmentsPerWorld;
        this.currentSegment = Math.min(this.currentSegment, this.totalSegments - 1);
        if (!this.currentLevel) {
            this.currentLevel = this.currentWorld * this.segmentsPerWorld + this.currentSegment + 1;
        }

        if (this.spawnY === -1) {
            this.spawnY = this.map.height - 2;
        }
        this.spawnX = Math.max(1, Math.min(this.segmentWidth - 2, this.spawnX ?? 6));
        this.spawnY = Math.max(1, Math.min(this.map.height - 2, this.spawnY ?? 4));

        this.createPlayer();

        // Create NPCs/Guests
        this.createNPCs();

        // Set layer depths
        if (aboveLayer) {
            aboveLayer.setDepth(10);
        }
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

        this.updateSegmentView();
        this.createSegmentLabel();

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
        this.keys = this.input.keyboard.addKeys('W,A,S,D,C,SPACE,ENTER,L,J');

        // Mobile touch controls
        this.createMobileControls();
        this.scale.on('resize', () => {
            this.destroyMobileControls();
            this.createMobileControls();
        });

        this.eventHandlers = {};
        this.bindEvent = (eventName, handler) => {
            this.eventHandlers[eventName] = handler;
            EventBus.on(eventName, handler);
        };

        // Start overworld music
        if (!this.music || !this.music.isPlaying) {
            this.music = this.sound.add('overworld-music', {
                loop: true,
                volume: 0.4
            });
            this.music.play();
        }

        // Listen for battle start - disable input during battle
        this.bindEvent('start-battle', () => {
            this.battleActive = true;
            // Pause overworld music during battle - safely check sound context
            if (this.music && this.music.isPlaying) {
                try {
                    this.music.pause();
                } catch (e) {
                    console.warn('Failed to pause overworld music:', e);
                }
            }
            // Hide mobile controls during battle
            this.setMobileControlsVisible(false);
        });

        // Listen for battle starting from encounter dialog
        this.bindEvent('battle-starting', () => {
            this.battleActive = true;
            // Pause overworld music during battle - safely check sound context
            if (this.music && this.music.isPlaying) {
                try {
                    this.music.pause();
                } catch (e) {
                    console.warn('Failed to pause overworld music:', e);
                }
            }
            // Hide mobile controls during battle
            this.setMobileControlsVisible(false);
        });

        // Listen for battle end - re-enable input
        this.bindEvent('battle-ended', () => {
            this.battleActive = false;
            // Resume overworld music after battle - use play() instead of resume()
            if (this.music && this.sound && this.sound.context) {
                try {
                    if (!this.music.isPlaying) {
                        this.music.play();
                    }
                } catch (e) {
                    console.warn('Failed to resume overworld music:', e);
                }
            }
            // Show mobile controls after battle
            this.setMobileControlsVisible(true);
        });

        // Listen for battle rejection
        this.bindEvent('battle-rejected', () => {
            if (this.battleNPC) {
                this.battleNPC.challenged = false;
                this.battleNPC = null;
            }
            this.battleActive = false;
            // Resume music if paused - use play() instead of resume()
            if (this.music && this.sound && this.sound.context) {
                try {
                    if (!this.music.isPlaying) {
                        this.music.play();
                    }
                } catch (e) {
                    console.warn('Failed to resume overworld music:', e);
                }
            }
            // Show mobile controls
            this.setMobileControlsVisible(true);
        });

        // Listen for player name and update display
        this.bindEvent('player-name-set', (name) => {
            this.playerName = name || 'Player';
            if (this.playerNameText) {
                this.playerNameText.setText(this.playerName);
            }
        });

        // Audio control events from BattleScreen
        this.bindEvent('play-battle-music', () => {
            // Stop overworld music and play battle music - safely check sound context
            if (this.music && this.music.isPlaying) {
                try {
                    this.music.stop();
                } catch (e) {
                    console.warn('Failed to stop overworld music:', e);
                }
            }
            // Check if sound manager exists
            if (this.sound && this.sound.context) {
                try {
                    if (!this.battleMusic) {
                        this.battleMusic = this.sound.add('battle-music', {
                            loop: true,
                            volume: 0.5
                        });
                    }
                    if (this.battleMusic && !this.battleMusic.isPlaying) {
                        this.battleMusic.play();
                    }
                } catch (e) {
                    console.warn('Failed to play battle music:', e);
                }
            }
        });

        this.bindEvent('stop-battle-music', () => {
            // Stop battle music and resume overworld music - safely check sound context
            if (this.battleMusic && this.battleMusic.isPlaying) {
                try {
                    this.battleMusic.stop();
                } catch (e) {
                    console.warn('Failed to stop battle music:', e);
                }
            }
            if (this.music && this.sound && this.sound.context && !this.music.isPlaying) {
                try {
                    this.music.play();
                } catch (e) {
                    console.warn('Failed to resume overworld music:', e);
                }
            }
        });

        this.bindEvent('play-victory-sound', () => {
            // Play victory fanfare (doesn't loop) - safely check sound context
            if (this.sound && this.sound.context) {
                try {
                    if (!this.victorySound) {
                        this.victorySound = this.sound.add('victory-fanfare', {
                            loop: false,
                            volume: 0.6
                        });
                    }
                    // Stop battle music first
                    if (this.battleMusic && this.battleMusic.isPlaying) {
                        this.battleMusic.stop();
                    }
                    this.victorySound.play();
                } catch (e) {
                    console.warn('Failed to play victory sound:', e);
                }
            }
        });

        // Global mute/unmute control
        this.bindEvent('toggle-mute', (isMuted) => {
            if (this.sound && this.sound.context) {
                this.sound.mute = isMuted;
            }
        });

        // Level progression - spawn next batch of NPCs
        this.bindEvent('spawn-next-level', (data) => {
            console.log('spawn-next-level event received:', data);
            if (!this.sys?.isActive()) {
                return;
            }
            this.unlockedLevel = data.level;
            this.updateSegmentView();
            this.updateSegmentLabel();
        });

        // Handle game restart
        this.bindEvent('restart-game', () => {
            console.log('restart-game event received');
            // Reset level and spawned indices
            this.currentLevel = 1;
            this.unlockedLevel = 1;
            this.currentSegment = 0;
            this.spawnedGuestIndices = [];
            // Clear all NPCs and spawn fresh level 1
            this.clearAllNPCs();
            this.spawnNPCsForLevel(10);
            // Reset player position
            this.player.tileX = this.spawnX || 6;
            this.player.tileY = this.spawnY || 4;
            this.player.sprite.setPosition(this.player.tileX * 32 + 16, this.player.tileY * 32 + 16);
            // Reset player name text position
            if (this.playerNameText) {
                this.playerNameText.setPosition(this.player.tileX * 32 + 16, this.player.tileY * 32 + 16 + 35);
            }
        });

        // Listen for NPC removal (when guest is captured)
        this.bindEvent('remove-npc', (guestId) => {
            this.removeNPC(guestId);
        });

        // Listen for return to menu (game over retry)
        this.bindEvent('return-to-menu', () => {
            console.log('return-to-menu event received - transitioning to MainMenu');
            // Stop overworld music
            if (this.music) {
                this.music.stop();
            }
            // Transition to MainMenu scene
            this.scene.start('MainMenu');
        });

        this.events.once('shutdown', () => {
            if (!this.eventHandlers) return;
            Object.entries(this.eventHandlers).forEach(([eventName, handler]) => {
                EventBus.off(eventName, handler);
            });
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

        // Create player name text below sprite
        this.playerNameText = this.add.text(px, py + 35, this.playerName, {
            fontSize: '10px',
            fontFamily: 'Press Start 2P, monospace',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this.playerNameText.setOrigin(0.5, 0);
        this.playerNameText.setDepth(10);
    }

    createNPCs ()
    {
        // Spawn first 10 NPCs for level 1
        this.spawnNPCsForLevel(10);
    }

    spawnNPCsForLevel(count)
    {
        // Get fixed opponents for this stage
        const stageNumber = this.currentLevel;
        const stageOpponents = getStageOpponents(stageNumber);
        if (!stageOpponents || stageOpponents.length === 0) {
            console.log('No opponents defined for this stage!');
            return;
        }

        // Get all available guests from GuestDataManager
        const allGuests = guestDataManager.getSelectedGuests();
        if (allGuests.length === 0) {
            console.error('No guests loaded! NPCs will not be created.');
            return;
        }

        console.log(`Total guests loaded: ${allGuests.length}`);
        console.log('Sample guest names:', allGuests.slice(0, 10).map(g => g.name));

        // Match stage opponents with guest data (skip captured)
        const guestsToSpawn = [];
        for (const opponentName of stageOpponents) {
            const guest = allGuests.find(g => g.name === opponentName);
            if (guest && !guest.captured) {
                guestsToSpawn.push(guest);
            } else {
                console.warn(`Opponent "${opponentName}" not found in guest data`);
            }
        }

        if (guestsToSpawn.length === 0) {
            console.error('No matching guests found for this stage!');
            return;
        }

        console.log(`Spawning ${guestsToSpawn.length} NPCs for Stage ${stageNumber}:`, stageOpponents);

        const mapWidth = this.segmentWidth;
        const mapHeight = this.map.height;
        const segmentStartY = this.currentSegment * this.segmentHeight;
        const segmentEndY = segmentStartY + this.segmentHeight - 1;
        const minSpacing = 1; // Allow tighter placement to avoid missing NPCs
        const maxAttempts = 2000; // Increase attempts to improve placement success

        let npcCount = 0;
        let attempts = 0;

        // Helper function to check if position is valid
        const isValidPosition = (x, y, existingPositions) => {
            // Check bounds
            if (x < 2 || x >= mapWidth - 2 || y < segmentStartY + 2 || y > segmentEndY - 2) {
                return false;
            }

            // Check if tile is walkable
            const tile = this.worldLayer.getTileAt(x, y);
            if (!tile || tile.collides) {
                return false;
            }

            // Check spacing from existing NPCs
            for (const pos of existingPositions) {
                const distance = Math.abs(pos.x - x) + Math.abs(pos.y - y);
                if (distance < minSpacing) {
                    return false;
                }
            }

            return true;
        };

        const npcPositions = this.npcs.map(npc => ({ x: npc.tileX, y: npc.tileY }));

        // Place NPCs
        while (npcCount < guestsToSpawn.length && attempts < maxAttempts * guestsToSpawn.length) {
            attempts++;

            let x, y;

            // For first NPC of first level (Elena), place near starting position
            if (this.currentLevel === 1 && npcCount === 0 && this.npcs.length === 0) {
                const offsetX = Math.floor(Math.random() * 10) - 5;
                const offsetY = Math.floor(Math.random() * 10) - 5;
                x = Math.max(2, Math.min(mapWidth - 2, this.player.tileX + offsetX));
                y = Math.max(segmentStartY + 2, Math.min(segmentEndY - 2, this.player.tileY + offsetY));
            } else {
                // Random position for other guests
                x = Math.floor(Math.random() * (mapWidth - 6)) + 3;
                y = Math.floor(Math.random() * (segmentEndY - segmentStartY - 4)) + segmentStartY + 3;
            }

            if (isValidPosition(x, y, npcPositions)) {
                const guest = guestsToSpawn[npcCount];
                const guestId = guest.id;
                const guestName = guest.name;
                const avatarKey = guest.avatarKey;

                const npc = {
                    id: guestId,
                    name: guestName,
                    tileX: x,
                    tileY: y,
                    direction: ['down', 'up', 'left', 'right'][Math.floor(Math.random() * 4)],
                    sprite: null,
                    challenged: false,
                    episode: guest.episode || guestName,
                    difficulty: guest.difficulty || 'Medium'
                };

                // Create NPC sprite using avatar image
                let sprite;

                if (this.textures.exists(avatarKey)) {
                    sprite = this.add.sprite(
                        x * 32 + 16,
                        y * 32 + 16,
                        avatarKey
                    );
                    sprite.setDisplaySize(72, 72);
                } else {
                    console.warn(`Avatar not found for ${guestName}, using fallback`);
                    const colors = [0xFF69B4, 0x87CEEB, 0x98D982, 0xFFD700, 0xFF6B6B, 0x9B59B6];
                    sprite = this.add.rectangle(
                        x * 32 + 16,
                        y * 32 + 16,
                        36, 36,
                        colors[npcCount % colors.length]
                    );
                    sprite.setStrokeStyle(2, 0x000000);
                }
                sprite.setDepth(5);

                npc.sprite = sprite;
                npc.defeated = false;
                this.npcs.push(npc);
                npcPositions.push({ x, y });
                npcCount++;

                console.log(`✓ Placed NPC ${npcCount}/${guestsToSpawn.length}: ${guestName} at (${x}, ${y})`);
            }
        }

        if (npcCount < guestsToSpawn.length) {
            console.warn(`Warning: Only placed ${npcCount}/${guestsToSpawn.length} NPCs after ${attempts} attempts`);
        } else {
            console.log(`✓ Successfully placed ${npcCount} NPCs for level ${this.currentLevel}`);
        }
    }

    clearAllNPCs()
    {
        // Remove all NPC sprites
        this.npcs.forEach(npc => {
            if (npc.sprite) {
                npc.sprite.destroy();
            }
        });
        this.npcs = [];
        console.log('✓ Cleared all NPCs from map');
    }

    removeNPC (guestId)
    {
        // Find the NPC with this guest ID
        const npcIndex = this.npcs.findIndex(npc => npc.id === guestId);
        if (npcIndex !== -1) {
            const npc = this.npcs[npcIndex];
            // Destroy the sprite
            if (npc.sprite) {
                npc.sprite.destroy();
            }
            // Remove from npcs array
            this.npcs.splice(npcIndex, 1);
            console.log(`✓ Removed NPC ${guestId} from map`);
        }
    }

    update (time)
    {
        if (this.sys?.isDestroyed || !this.sys?.isActive()) {
            return;
        }
        // Disable all input during battle
        if (this.battleActive) {
            return;
        }

        const debugCooldown = 400;
        if (this.keys?.L?.isDown && time - (this.lastDebugUnlockTime || 0) > debugCooldown) {
            this.lastDebugUnlockTime = time;
            const totalStages = getTotalStages();
            if (this.unlockedLevel < totalStages) {
                this.unlockedLevel += 1;
                this.updateSegmentView();
                this.updateSegmentLabel();
                console.log(`[debug] L pressed: unlockedLevel -> ${this.unlockedLevel}`);
                this.showLockedMessage(`Map ${this.unlockedLevel} unlocked`);
            }
        }
        if (this.keys?.J?.isDown && time - (this.lastDebugJumpTime || 0) > debugCooldown) {
            this.lastDebugJumpTime = time;
            const totalStages = getTotalStages();
            const maxLevelAvailable = Math.min(totalStages, WORLD_CONFIGS.length * this.segmentsPerWorld);
            const targetLevel = Math.min(this.unlockedLevel, maxLevelAvailable);
            const targetWorld = Math.floor((targetLevel - 1) / this.segmentsPerWorld);
            const targetSegment = (targetLevel - 1) % this.segmentsPerWorld;
            console.log(`[debug] J pressed: targetLevel=${targetLevel} world=${targetWorld} segment=${targetSegment}`);
            if (!this.isWorldAvailable(targetWorld)) {
                this.showLockedMessage('New area is loading — try again soon');
                return;
            }
            this.scene.restart({
                playerName: this.playerName,
                map: WORLD_CONFIGS[targetWorld].key,
                worldIndex: targetWorld,
                segmentIndex: targetSegment,
                level: targetLevel,
                unlockedLevel: Math.max(this.unlockedLevel, targetLevel),
                spawnX: 6,
                spawnY: 4
            });
            return;
        }

        if (time - this.lastMoveTime < this.moveDelay) {
            return;
        }

        let dx = 0;
        let dy = 0;

        // Keyboard controls
        if (this.cursors.up.isDown || this.keys.W.isDown) {
            dy = -1;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            dy = 1;
        } else if (this.cursors.left.isDown || this.keys.A.isDown) {
            dx = -1;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            dx = 1;
        }

        // Mobile controls (override keyboard if active)
        if (this.mobileDirection) {
            dx = 0;
            dy = 0;
            if (this.mobileDirection === 'up') dy = -1;
            else if (this.mobileDirection === 'down') dy = 1;
            else if (this.mobileDirection === 'left') dx = -1;
            else if (this.mobileDirection === 'right') dx = 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.movePlayer(dx, dy);
            this.lastMoveTime = time;
        }

        // Update interaction prompt
        this.updateInteractionPrompt();

        // Collection hotkey
        if (Phaser.Input.Keyboard.JustDown(this.keys.C)) {
            EventBus.emit('open-collection');
        }
    }

    updateInteractionPrompt ()
    {
        // Debug: Log NPC array length occasionally
        if (!this.lastNPCLogTime || Date.now() - this.lastNPCLogTime > 5000) {
            console.log(`updateInteractionPrompt: ${this.npcs.length} NPCs available`);
            this.lastNPCLogTime = Date.now();
        }

        // Check for NPCs within 2 tile range (closer detection)
        const interactionRange = 2;
        let nearestNPC = null;
        let nearestDistance = Infinity;

        this.npcs.forEach(npc => {
            if (!npc.challenged && !npc.defeated) {
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
                console.log('Found nearest NPC:', nearestNPC.name, 'at distance:', nearestDistance);
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

        const segmentStartY = this.currentSegment * this.segmentHeight;
        const segmentEndY = segmentStartY + this.segmentHeight;

        // Block map edges
        if (newX < 0 || newX >= this.segmentWidth) {
            this.showLockedMessage();
            return;
        }

        // Move north to previous segment
        if (newY < segmentStartY) {
            if (this.currentSegment > 0) {
                this.currentSegment -= 1;
                this.currentLevel = this.currentWorld * this.segmentsPerWorld + this.currentSegment + 1;
                this.clearAllNPCs();
                this.spawnNPCsForLevel(10);
                this.player.tileY = segmentStartY - 2;
                this.player.tileX = newX;
                this.snapPlayerToTile();
                this.updateSegmentLabel();
            } else if (this.currentWorld > 0) {
                const prevWorld = this.currentWorld - 1;
                const prevSegment = this.segmentsPerWorld - 1;
                const prevLevel = prevWorld * this.segmentsPerWorld + prevSegment + 1;
                this.scene.restart({
                    playerName: this.playerName,
                    map: WORLD_CONFIGS[prevWorld].key,
                    worldIndex: prevWorld,
                    segmentIndex: prevSegment,
                    level: prevLevel,
                    unlockedLevel: this.unlockedLevel,
                    spawnX: newX,
                    spawnY: -1
                });
            } else {
                this.showLockedMessage();
            }
            return;
        }

        // Move south to next segment if unlocked
        if (newY >= segmentEndY) {
            const nextLevel = this.currentLevel + 1;
            const maxSegmentsUnlocked = this.unlockedLevel - (this.currentWorld * this.segmentsPerWorld);
            if (this.currentSegment + 1 < Math.min(maxSegmentsUnlocked, this.segmentsPerWorld)) {
                this.currentSegment += 1;
                this.currentLevel = nextLevel;
                this.clearAllNPCs();
                this.spawnNPCsForLevel(10);
                this.player.tileY = segmentEndY + 1;
                this.player.tileX = newX;
                this.snapPlayerToTile();
                this.updateSegmentLabel();
            } else if (nextLevel <= this.unlockedLevel && this.currentSegment + 1 >= this.segmentsPerWorld && this.currentWorld + 1 < WORLD_CONFIGS.length) {
                const nextWorld = this.currentWorld + 1;
                const nextSegment = 0;
                if (!this.isWorldAvailable(nextWorld)) {
                    this.showLockedMessage('New area is loading — try again soon');
                    return;
                }
                this.scene.restart({
                    playerName: this.playerName,
                    map: WORLD_CONFIGS[nextWorld].key,
                    worldIndex: nextWorld,
                    segmentIndex: nextSegment,
                    level: nextLevel,
                    unlockedLevel: this.unlockedLevel,
                    spawnX: newX,
                    spawnY: 1
                });
            } else {
                this.showLockedMessage();
            }
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

            // Move player name text with sprite
            if (this.playerNameText) {
                this.tweens.add({
                    targets: this.playerNameText,
                    x: newX * 32 + 16,
                    y: newY * 32 + 16 + 35,
                    duration: this.moveDelay - 50,
                    ease: 'Linear'
                });
            }
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

    updateSegmentView ()
    {
        if (!this.map || !this.cameras?.main) return;
        if (this.sys?.isDestroyed || !this.sys?.isActive()) return;
        const unlockedSegments = Math.max(1, Math.min(this.unlockedLevel - (this.currentWorld * this.segmentsPerWorld), this.segmentsPerWorld));
        const heightTiles = unlockedSegments * this.segmentHeight;
        const heightPx = heightTiles * this.map.tileHeight;
        const widthPx = this.segmentWidth * this.map.tileWidth;

        this.cameras.main.setBounds(0, 0, widthPx, heightPx);
        if (this.minimap) {
            this.minimap.setBounds(0, 0, widthPx, heightPx);
        }

        this.updateSegmentLabel();
    }

    createSegmentLabel ()
    {
        this.segmentLabel = this.add.text(12, 12, '', {
            fontSize: '10px',
            fontFamily: 'Press Start 2P, monospace',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.segmentLabel.setScrollFactor(0);
        this.segmentLabel.setDepth(2000);
        this.updateSegmentLabel();
    }

    updateSegmentLabel ()
    {
        if (!this.segmentLabel || !this.segmentLabel.active) return;
        if (this.sys?.isDestroyed || !this.sys?.isActive()) return;
        const current = this.currentLevel;
        const totalUnlocked = this.unlockedLevel;
        this.segmentLabel.setText(`Map ${current} / ${totalUnlocked}`);
    }

    snapPlayerToTile ()
    {
        if (!this.player?.sprite) return;
        this.player.sprite.setPosition(this.player.tileX * 32 + 16, this.player.tileY * 32 + 16);
        if (this.playerNameText) {
            this.playerNameText.setPosition(this.player.tileX * 32 + 16, this.player.tileY * 32 + 16 + 35);
        }
    }

    showLockedMessage (messageOverride)
    {
        if (this.sys?.isDestroyed || !this.sys?.isActive()) {
            return;
        }
        const message = messageOverride || 'Area locked — level up to continue';
        if (!this.lockedText || !this.lockedText.active || this.lockedText.scene !== this) {
            this.lockedText = this.add.text(this.scale.width / 2, 40, message, {
                fontSize: '10px',
                fontFamily: 'Press Start 2P, monospace',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            });
            this.lockedText.setOrigin(0.5);
            this.lockedText.setScrollFactor(0);
            this.lockedText.setDepth(2000);
        } else {
            this.lockedText.setText(message);
            this.lockedText.setAlpha(1);
            this.lockedText.setVisible(true);
        }

        if (this.lockedMessageTimer) {
            this.lockedMessageTimer.remove(false);
        }
        this.lockedMessageTimer = this.time.delayedCall(1200, () => {
            if (this.lockedText) {
                this.lockedText.setAlpha(0);
                this.lockedText.setVisible(false);
            }
        });
    }

    isWorldAvailable (worldIndex)
    {
        const config = WORLD_CONFIGS[worldIndex];
        if (!config) return false;
        if (config.key === 'desert-map') {
            const desertReady = this.registry.get('desertAssetsLoaded');
            return (!!desertReady || (this.cache.tilemap.exists(config.key) && this.textures.exists(config.tilesKey)))
                && this.cache.tilemap.exists(config.key)
                && this.textures.exists(config.tilesKey);
        }
        return true;
    }

    handleInteraction ()
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

    setMobileControlsVisible (visible)
    {
        if (!this.mobileControls) return;

        Object.values(this.mobileControls).forEach(control => {
            if (control.button) control.button.setVisible(visible);
            if (control.text) control.text.setVisible(visible);
        });
    }

    destroyMobileControls ()
    {
        if (!this.mobileControls) return;

        Object.values(this.mobileControls).forEach(control => {
            if (control.button) control.button.destroy();
            if (control.text) control.text.destroy();
        });

        this.mobileControls = null;
        this.mobileDirection = null;
    }

    createMobileControls ()
    {
        // Only show on touch devices or small screens
        const isMobile = this.sys.game.device.input.touch ||
            this.sys.game.device.os.android ||
            this.sys.game.device.os.iOS ||
            window.matchMedia('(pointer: coarse)').matches ||
            window.innerWidth <= 1024 ||
            window.innerHeight <= 600;

        if (!isMobile) {
            return;
        }

        // Virtual D-Pad
        const buttonSize = 60;
        const buttonGap = 10;
        const padding = 20;

        // Position in bottom-left corner
        const startX = padding + buttonSize + 12;
        const startY = this.scale.height - padding - buttonSize;

        // Create button background circle
        const createButton = (x, y, direction, icon) => {
            const button = this.add.circle(x, y, buttonSize / 2, 0x000000, 0.5);
            button.setScrollFactor(0);
            button.setDepth(1500);
            button.setInteractive({ useHandCursor: true });

            // Button icon
            const text = this.add.text(x, y, icon, {
                fontSize: '28px',
                color: '#FFD700',
                fontFamily: 'Arial, sans-serif'
            });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(1501);

            // Hover/press effects
            button.on('pointerdown', () => {
                button.setFillStyle(0xFFD700, 0.7);
                text.setColor('#000000');
                this.mobileDirection = direction;
                this.lastMoveTime = 0; // Allow immediate movement
            });

            button.on('pointerup', () => {
                button.setFillStyle(0x000000, 0.5);
                text.setColor('#FFD700');
                this.mobileDirection = null;
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x000000, 0.5);
                text.setColor('#FFD700');
                this.mobileDirection = null;
            });

            return { button, text };
        };

        // Create D-Pad buttons
        this.mobileControls = {
            up: createButton(startX, startY - buttonSize - buttonGap, 'up', '▲'),
            down: createButton(startX, startY + buttonSize + buttonGap, 'down', '▼'),
            left: createButton(startX - buttonSize - buttonGap, startY, 'left', '◀'),
            right: createButton(startX + buttonSize + buttonGap, startY, 'right', '▶')
        };

        // Center button for interaction
        const centerButton = this.add.circle(startX, startY, buttonSize / 2, 0x4CAF50, 0.6);
        centerButton.setScrollFactor(0);
        centerButton.setDepth(1500);
        centerButton.setInteractive({ useHandCursor: true });

        const centerText = this.add.text(startX, startY, 'A', {
            fontSize: '24px',
            color: '#FFFFFF',
            fontFamily: 'Press Start 2P, monospace',
            fontStyle: 'bold'
        });
        centerText.setOrigin(0.5);
        centerText.setScrollFactor(0);
        centerText.setDepth(1501);

        centerButton.on('pointerdown', () => {
            centerButton.setFillStyle(0x45A049, 0.8);
            // Trigger interaction (same as SPACE key)
            this.handleInteraction();
        });

        centerButton.on('pointerup', () => {
            centerButton.setFillStyle(0x4CAF50, 0.6);
        });

        this.mobileControls.interact = { button: centerButton, text: centerText };

        // Track mobile direction
        this.mobileDirection = null;

        // Ensure controls are visible by default
        this.setMobileControlsVisible(true);

        // Ensure controls are visible by default
        this.setMobileControlsVisible(true);

        // Make NPCs clickable
        this.npcs.forEach(npc => {
            if (npc.sprite && npc.sprite.setInteractive) {
                npc.sprite.setInteractive({ useHandCursor: true });
                npc.sprite.on('pointerdown', () => {
                    // Check if in range
                    const distance = Math.abs(npc.tileX - this.player.tileX) + Math.abs(npc.tileY - this.player.tileY);
                    if (distance <= 5 && !npc.defeated) {
                        this.nearestNPC = npc;
                        this.handleInteraction();
                    }
                });
            }
        });
    }
}
