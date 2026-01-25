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
        // Pause overworld music during battle
        if (scene.musicManager) {
            scene.musicManager.pause();
        }
        // Hide mobile controls during battle
        scene.setMobileControlsVisible(false);
    });

    // Listen for battle starting from encounter dialog
    scene.bindEvent('battle-starting', () => {
        scene.battleActive = true;
        // Pause overworld music during battle
        if (scene.musicManager) {
            scene.musicManager.pause();
        }
        // Hide mobile controls during battle
        scene.setMobileControlsVisible(false);
    });

    // Listen for battle end - re-enable input
    scene.bindEvent('battle-ended', () => {
        scene.battleActive = false;

        // Check if victory or defeat sounds are playing before resuming music
        const victoryPlaying = scene.victorySound && scene.victorySound.isPlaying;
        const defeatPlaying = scene.defeatSound && scene.defeatSound.isPlaying;

        if (!victoryPlaying && !defeatPlaying) {
            // No victory/defeat sounds playing, resume map music
            if (scene.musicManager) {
                scene.musicManager.resume();
            }
        }
        // If victory/defeat is playing, the 'stop-battle-music' event handler
        // will handle resuming the music after the sound completes

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
        // Resume overworld music when battle is rejected
        if (scene.musicManager) {
            scene.musicManager.resume();
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
        // Play battle music (overworld music already paused from start-battle event)
        if (scene.musicManager && scene.sound && scene.sound.context) {
            try {
                // Create battle music as a separate sound object (not managed by MusicManager)
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
        // Stop only the battle music
        if (scene.battleMusic && scene.battleMusic.isPlaying) {
            try {
                scene.battleMusic.stop();
            } catch (e) {
                console.warn('Failed to stop battle music:', e);
            }
        }

        // Check if victory or defeat sounds are playing
        const victoryPlaying = scene.victorySound && scene.victorySound.isPlaying;
        const defeatPlaying = scene.defeatSound && scene.defeatSound.isPlaying;

        if (victoryPlaying || defeatPlaying) {
            // Don't resume map music yet - wait for victory/defeat sound to finish
            console.log('Victory/defeat sound playing, delaying map music resume');

            // Set up one-time listeners to resume map music after sound finishes
            if (victoryPlaying && scene.victorySound) {
                scene.victorySound.once('complete', () => {
                    if (scene.musicManager) {
                        scene.musicManager.resume();
                    }
                });
            }
            if (defeatPlaying && scene.defeatSound) {
                scene.defeatSound.once('complete', () => {
                    if (scene.musicManager) {
                        scene.musicManager.resume();
                    }
                });
            }
        } else {
            // No victory/defeat sounds playing, resume map music immediately
            if (scene.musicManager) {
                scene.musicManager.resume();
            }
        }
    });

    scene.bindEvent('play-victory-sound', () => {
        // Play victory fanfare without affecting map music
        if (scene.sound && scene.sound.context) {
            try {
                // Stop battle music first
                if (scene.battleMusic && scene.battleMusic.isPlaying) {
                    scene.battleMusic.stop();
                }
                // Stop and clean up any existing victory sound
                if (scene.victorySound) {
                    scene.victorySound.stop();
                    scene.victorySound.destroy();
                }
                // Create fresh victory sound
                scene.victorySound = scene.sound.add('victory-fanfare', {
                    loop: false,
                    volume: 0.6
                });
                scene.victorySound.play();

                // Auto-stop after 5 seconds for shorter duration
                scene.time.delayedCall(5000, () => {
                    if (scene.victorySound && scene.victorySound.isPlaying) {
                        scene.victorySound.stop();
                    }
                });
            } catch (e) {
                console.warn('Failed to play victory sound:', e);
            }
        }
    });

    scene.bindEvent('play-defeat-sound', () => {
        // Play defeat music without affecting map music
        if (scene.sound && scene.sound.context) {
            try {
                // Stop battle music first
                if (scene.battleMusic && scene.battleMusic.isPlaying) {
                    scene.battleMusic.stop();
                }
                // Stop and clean up any existing defeat sound
                if (scene.defeatSound) {
                    scene.defeatSound.stop();
                    scene.defeatSound.destroy();
                }
                // Create fresh defeat sound
                scene.defeatSound = scene.sound.add('defeat-music', {
                    loop: false,
                    volume: 0.5
                });
                scene.defeatSound.play();

                // Auto-stop after 5 seconds for shorter duration
                scene.time.delayedCall(5000, () => {
                    if (scene.defeatSound && scene.defeatSound.isPlaying) {
                        scene.defeatSound.stop();
                    }
                });
            } catch (e) {
                console.warn('Failed to play defeat sound:', e);
            }
        }
    });

    // Global mute/unmute control
    scene.bindEvent('toggle-mute', (isMuted) => {
        if (scene.musicManager) {
            scene.musicManager.setMute(isMuted);
        } else if (scene.sound && scene.sound.context) {
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
        // Stop all music
        if (scene.musicManager) {
            scene.musicManager.stopAll();
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
