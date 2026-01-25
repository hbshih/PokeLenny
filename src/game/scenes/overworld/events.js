import { EventBus } from '../../EventBus';

export const bindOverworldEvents = (scene) => {
    scene.eventHandlers = {};
    scene.bindEvent = (eventName, handler) => {
        scene.eventHandlers[eventName] = handler;
        EventBus.on(eventName, handler);
    };

    // Listen for battle start - disable input during battle
    scene.bindEvent('start-battle', () => {
        scene.battleActive = true;
        // Pause overworld music during battle - safely check sound context
        if (scene.music && scene.music.isPlaying) {
            try {
                scene.music.pause();
            } catch (e) {
                console.warn('Failed to pause overworld music:', e);
            }
        }
        // Hide mobile controls during battle
        scene.setMobileControlsVisible(false);
    });

    // Listen for battle starting from encounter dialog
    scene.bindEvent('battle-starting', () => {
        scene.battleActive = true;
        // Pause overworld music during battle - safely check sound context
        if (scene.music && scene.music.isPlaying) {
            try {
                scene.music.pause();
            } catch (e) {
                console.warn('Failed to pause overworld music:', e);
            }
        }
        // Hide mobile controls during battle
        scene.setMobileControlsVisible(false);
    });

    // Listen for battle end - re-enable input
    scene.bindEvent('battle-ended', () => {
        scene.battleActive = false;
        // Resume overworld music after battle - use play() instead of resume()
        if (scene.music && scene.sound && scene.sound.context) {
            try {
                if (!scene.music.isPlaying) {
                    scene.music.play();
                }
            } catch (e) {
                console.warn('Failed to resume overworld music:', e);
            }
        }
        // Show mobile controls after battle
        scene.setMobileControlsVisible(true);
    });

    // Listen for battle rejection
    scene.bindEvent('battle-rejected', () => {
        if (scene.battleNPC) {
            scene.battleNPC.challenged = false;
            scene.battleNPC = null;
        }
        scene.battleActive = false;
        // Resume music if paused - use play() instead of resume()
        if (scene.music && scene.sound && scene.sound.context) {
            try {
                if (!scene.music.isPlaying) {
                    scene.music.play();
                }
            } catch (e) {
                console.warn('Failed to resume overworld music:', e);
            }
        }
        // Show mobile controls
        scene.setMobileControlsVisible(true);
    });

    // Listen for player name and update display
    scene.bindEvent('player-name-set', (name) => {
        scene.playerName = name || 'Player';
        if (scene.playerNameText) {
            scene.playerNameText.setText(scene.playerName);
        }
    });

    // Audio control events from BattleScreen
    scene.bindEvent('play-battle-music', () => {
        // Stop overworld music and play battle music - safely check sound context
        if (scene.music && scene.music.isPlaying) {
            try {
                scene.music.stop();
            } catch (e) {
                console.warn('Failed to stop overworld music:', e);
            }
        }
        // Check if sound manager exists
        if (scene.sound && scene.sound.context) {
            try {
                if (!scene.battleMusic) {
                    scene.battleMusic = scene.sound.add('battle-music', {
                        loop: true,
                        volume: 0.5
                    });
                }
                if (scene.battleMusic && !scene.battleMusic.isPlaying) {
                    scene.battleMusic.play();
                }
            } catch (e) {
                console.warn('Failed to play battle music:', e);
            }
        }
    });

    scene.bindEvent('stop-battle-music', () => {
        // Stop battle music and resume overworld music - safely check sound context
        if (scene.battleMusic && scene.battleMusic.isPlaying) {
            try {
                scene.battleMusic.stop();
            } catch (e) {
                console.warn('Failed to stop battle music:', e);
            }
        }
        if (scene.music && scene.sound && scene.sound.context && !scene.music.isPlaying) {
            try {
                scene.music.play();
            } catch (e) {
                console.warn('Failed to resume overworld music:', e);
            }
        }
    });

    scene.bindEvent('play-victory-sound', () => {
        // Play victory fanfare (doesn't loop) - safely check sound context
        if (scene.sound && scene.sound.context) {
            try {
                if (!scene.victorySound) {
                    scene.victorySound = scene.sound.add('victory-fanfare', {
                        loop: false,
                        volume: 0.6
                    });
                }
                // Stop battle music first
                if (scene.battleMusic && scene.battleMusic.isPlaying) {
                    scene.battleMusic.stop();
                }
                scene.victorySound.play();
            } catch (e) {
                console.warn('Failed to play victory sound:', e);
            }
        }
    });

    // Global mute/unmute control
    scene.bindEvent('toggle-mute', (isMuted) => {
        if (scene.sound && scene.sound.context) {
            scene.sound.mute = isMuted;
        }
    });

    // Level progression - spawn next batch of NPCs
    scene.bindEvent('spawn-next-level', (data) => {
        console.log('spawn-next-level event received:', data);
        if (!scene.sys?.isActive()) {
            return;
        }
        scene.unlockedLevel = data.level;
        scene.updateSegmentView();
        scene.updateSegmentLabel();
    });

    // Handle game restart
    scene.bindEvent('restart-game', () => {
        console.log('restart-game event received');
        // Reset level and spawned indices
        scene.currentLevel = 1;
        scene.unlockedLevel = 1;
        scene.currentSegment = 0;
        scene.spawnedGuestIndices = [];
        // Clear all NPCs and spawn fresh level 1
        scene.clearAllNPCs();
        scene.spawnNPCsForLevel(10);
        // Reset player position
        scene.player.tileX = scene.spawnX || 6;
        scene.player.tileY = scene.spawnY || 4;
        scene.player.sprite.setPosition(scene.player.tileX * 32 + 16, scene.player.tileY * 32 + 16);
        // Reset player name text position
        if (scene.playerNameText) {
            scene.playerNameText.setPosition(scene.player.tileX * 32 + 16, scene.player.tileY * 32 + 16 + 35);
        }
    });

    // Listen for NPC removal (when guest is captured)
    scene.bindEvent('remove-npc', (guestId) => {
        scene.removeNPC(guestId);
    });

    // Listen for return to menu (game over retry)
    scene.bindEvent('return-to-menu', () => {
        console.log('return-to-menu event received - transitioning to MainMenu');
        // Stop overworld music
        if (scene.music) {
            scene.music.stop();
        }
        // Transition to MainMenu scene
        scene.scene.start('MainMenu');
    });

    scene.events.once('shutdown', () => {
        if (!scene.eventHandlers) return;
        Object.entries(scene.eventHandlers).forEach(([eventName, handler]) => {
            EventBus.off(eventName, handler);
        });
    });

    EventBus.emit('current-scene-ready', scene);
};
