import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import gameState from '../GameState';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
        this.playerName = '';
        this.nameInput = null;
        this.nameInputText = null;
        this.nameInputBg = null;
        this.nameInputCursor = null;
        this.cursorBlinkTimer = null;
        this.music = null;
        this.isInputFocused = false;
    }

    create ()
    {
        // Initialize game state
        gameState.init();

        // Add scene shutdown listener to clean up DOM elements
        this.events.on('shutdown', this.cleanup, this);

        // Ensure fonts are loaded for canvas rendering
        // Small delay to let canvas context register the font
        this.time.delayedCall(100, () => {
            this.createMainMenu();
        });
    }

    cleanup ()
    {
        // Remove Phaser input elements
        if (this.nameInputText) {
            this.nameInputText.destroy();
            this.nameInputText = null;
        }
        if (this.nameInputBg) {
            this.nameInputBg.destroy();
            this.nameInputBg = null;
        }
        if (this.nameInputCursor) {
            this.nameInputCursor.destroy();
            this.nameInputCursor = null;
        }
        if (this.cursorBlinkTimer) {
            this.cursorBlinkTimer.remove();
            this.cursorBlinkTimer = null;
        }

        // Remove keyboard listeners
        this.input.keyboard.off('keydown', this.handleKeyDown, this);

        // Double check for any lingering DOM inputs
        const existingInput = document.getElementById('player-name-input');
        if (existingInput) {
            existingInput.remove();
        }

        // Stop music
        if (this.music) {
            this.music.stop();
        }
    }

    createMainMenu ()
    {
        // Clean up any existing HTML inputs first (in case scene was restarted)
        const existingInput = document.getElementById('player-name-input');
        if (existingInput) {
            existingInput.remove();
        }
        
        // Also remove any inputs that might have been created
        const allInputs = document.querySelectorAll('input[id="player-name-input"]');
        allInputs.forEach(input => input.remove());

        // Start menu music
        if (!this.music || !this.music.isPlaying) {
            this.music = this.sound.add('menu-music', {
                loop: true,
                volume: 0.5
            });
            this.music.play();
        }

        // Vibrant outdoor gradient background - Sky to grass like the logo
        const graphics = this.add.graphics();
        // Sky blue to bright green gradient (matching logo's outdoor vibe)
        graphics.fillGradientStyle(0x4A90E2, 0x5FB3E8, 0x6BC97C, 0x4CAF50, 1);
        graphics.fillRect(0, 0, this.scale.width, this.scale.height);

        // Add nature-themed animated particles
        this.createParticleField();

        // Subtle overlay for depth
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.15);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        // Logo - reduced size and proper positioning
        const logo = this.add.image(this.scale.width / 2, 140, 'logo');
        logo.setScale(0.22);

        // Logo glow effect - golden/sunny glow matching logo
        const logoGlow = this.add.image(this.scale.width / 2, 140, 'logo');
        logoGlow.setScale(0.24);
        logoGlow.setTint(0xFFD700); // Gold color matching logo's warm tones
        logoGlow.setAlpha(0.3);
        logoGlow.setDepth(-1);

        // Logo floating animation
        this.tweens.add({
            targets: [logo, logoGlow],
            y: { from: 140, to: 135 },
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Logo glow pulse
        this.tweens.add({
            targets: logoGlow,
            alpha: { from: 0.3, to: 0.5 },
            scale: { from: 0.27, to: 0.29 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Info text - warm golden color matching logo (reduced sizes)
        this.add.text(this.scale.width / 2, 250, 'BATTLE LENNY\'S PODCAST GUESTS', {
            fontFamily: '"DotGothic16"',
            fontSize: '16px',
            color: '#FFE066', // Warm yellow from logo
            align: 'center',
            stroke: '#8B4513', // Brown stroke matching logo's wood
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, 280, 'Answer Questions to Win!', {
            fontFamily: '"DotGothic16"',
            fontSize: '13px',
            color: '#FFFFFF',
            align: 'center',
            stroke: '#2D5016', // Dark green from logo
            strokeThickness: 3
        }).setOrigin(0.5);

        // Name input label - bright green matching logo
        this.add.text(this.scale.width / 2, 345, 'ENTER YOUR NAME:', {
            fontFamily: '"DotGothic16"',
            fontSize: '12px',
            color: '#FFD700', // Gold
            letterSpacing: 2,
            stroke: '#2D5016',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Create Phaser-based input for name
        this.createNameInput();

        // Start button - vibrant Pokemon-style
        const buttonY = 470;
        const buttonWidth = 380;
        const buttonHeight = 58;

        // Button glow - golden glow
        const buttonGlow = this.add.graphics();
        buttonGlow.fillStyle(0xFFD700, 0.3);
        buttonGlow.fillRoundedRect(this.scale.width / 2 - buttonWidth / 2 - 6, buttonY - buttonHeight / 2 - 6, buttonWidth + 12, buttonHeight + 12, 18);

        this.tweens.add({
            targets: buttonGlow,
            alpha: { from: 0.3, to: 0.6 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Button background - bright green with gold border
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x5FB859, 1); // Bright green from logo
        buttonBg.fillRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);
        buttonBg.lineStyle(5, 0xFFD700, 1); // Gold border
        buttonBg.strokeRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);

        const newGameButton = this.add.rectangle(this.scale.width / 2, buttonY, buttonWidth, buttonHeight, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        const newGameText = this.add.text(this.scale.width / 2, buttonY, '▶  START GAME', {
            fontFamily: '"DotGothic16"',
            fontSize: '18px',
            color: '#FFFFFF',
            letterSpacing: 3,
            stroke: '#2D5016',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Store button elements
        this.newGameButton = { button: newGameButton, bg: buttonBg, text: newGameText, glow: buttonGlow };

        newGameButton.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x4FA050, 1); // Darker green on hover
            buttonBg.fillRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);
            buttonBg.lineStyle(5, 0xFFE066, 1); // Bright yellow border on hover
            buttonBg.strokeRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);
            newGameText.setColor('#FFE066'); // Yellow text
            newGameText.setScale(1.03);
        });

        newGameButton.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x5FB859, 1);
            buttonBg.fillRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);
            buttonBg.lineStyle(5, 0xFFD700, 1);
            buttonBg.strokeRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 16);
            newGameText.setColor('#FFFFFF');
            newGameText.setScale(1);
        });

        newGameButton.on('pointerdown', () => {
            this.changeScene();
        });

        // Version text - properly separated below button
        this.add.text(this.scale.width / 2, 610, 'v0.5 • BUILT WITH PHASER 3', {
            fontFamily: '"DotGothic16"',
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: 1,
            stroke: 'rgba(45, 80, 22, 0.8)',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Global mute/unmute control
        EventBus.on('toggle-mute', (isMuted) => {
            if (this.sound && this.sound.context) {
                this.sound.mute = isMuted;
            }
        });

        EventBus.emit('current-scene-ready', this);
    }

    createParticleField ()
    {
        // Create floating particles with nature colors from logo
        const particles = [];
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);
            const size = Phaser.Math.FloatBetween(2, 5);
            // Nature colors: yellow sun sparkles, white clouds, green leaves
            const colors = [0xFFD700, 0xFFF8DC, 0x90EE90, 0xFFE066];
            const color = Phaser.Math.RND.pick(colors);

            const particle = this.add.circle(x, y, size, color, 0.4);
            particles.push(particle);

            // Animate particle floating
            this.tweens.add({
                targets: particle,
                y: y - Phaser.Math.Between(50, 150),
                alpha: { from: 0.4, to: 0 },
                duration: Phaser.Math.Between(3000, 6000),
                delay: Phaser.Math.Between(0, 3000),
                repeat: -1,
                onRepeat: () => {
                    particle.y = this.scale.height + 10;
                    particle.x = Phaser.Math.Between(0, this.scale.width);
                }
            });
        }
    }

    createScanlines ()
    {
        // Create CRT scanline effect
        const scanlines = this.add.graphics();
        scanlines.setAlpha(0.05);

        for (let y = 0; y < this.scale.height; y += 4) {
            scanlines.lineStyle(1, 0x000000, 1);
            scanlines.lineBetween(0, y, this.scale.width, y);
        }

        // Animate scanline moving
        this.tweens.add({
            targets: scanlines,
            y: { from: 0, to: 4 },
            duration: 100,
            repeat: -1,
            ease: 'Linear'
        });
    }

    createNameInput ()
    {
        // Ensure no old Phaser input elements exist
        if (this.nameInputBg) {
            this.nameInputBg.destroy();
        }
        if (this.nameInputText) {
            this.nameInputText.destroy();
        }
        if (this.nameInputCursor) {
            this.nameInputCursor.destroy();
        }
        if (this.cursorBlinkTimer) {
            this.cursorBlinkTimer.remove();
        }

        const inputX = this.scale.width / 2;
        const inputY = 390;
        const inputWidth = 340;
        const inputHeight = 50;

        // Create input background with glow effect
        this.nameInputBg = this.add.graphics();
        this.updateInputBackground(false);

        // Create input text
        const savedName = gameState.getPlayerName();
        const initialText = (savedName && savedName !== 'Player') ? savedName : '';
        this.playerName = initialText;

        this.nameInputText = this.add.text(inputX, inputY, initialText || 'TRAINER', {
            fontFamily: '"DotGothic16"',
            fontSize: '14px',
            color: initialText ? '#FFFFFF' : '#BBBBBB',
            letterSpacing: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Create blinking cursor
        this.nameInputCursor = this.add.text(inputX, inputY, '|', {
            fontFamily: '"DotGothic16"',
            fontSize: '14px',
            color: '#FFD700',
            letterSpacing: 4
        }).setOrigin(0.5, 0.5);
        this.nameInputCursor.setVisible(false);

        // Make input area interactive
        const inputZone = this.add.rectangle(inputX, inputY, inputWidth, inputHeight, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        inputZone.on('pointerdown', () => {
            this.focusInput();
        });

        // Make entire scene clickable to blur input when clicking outside
        this.input.on('pointerdown', (pointer) => {
            const inputBounds = {
                x: inputX - inputWidth / 2,
                y: inputY - inputHeight / 2,
                width: inputWidth,
                height: inputHeight
            };
            
            if (pointer.x < inputBounds.x || 
                pointer.x > inputBounds.x + inputBounds.width ||
                pointer.y < inputBounds.y || 
                pointer.y > inputBounds.y + inputBounds.height) {
                this.blurInput();
            }
        });

        // Keyboard input handling
        this.input.keyboard.on('keydown', this.handleKeyDown, this);

        // Auto-focus on scene start
        this.time.delayedCall(200, () => {
            this.focusInput();
        });

        // Start cursor blink animation
        this.startCursorBlink();
    }

    updateInputBackground (isFocused)
    {
        this.nameInputBg.clear();

        const inputX = this.scale.width / 2;
        const inputY = 390;
        const inputWidth = 340;
        const inputHeight = 50;
        const borderRadius = 14;
        const borderWidth = 4;

        // Outer glow
        if (isFocused) {
            this.nameInputBg.fillStyle(0xFFD700, 0.4);
            this.nameInputBg.fillRoundedRect(
                inputX - inputWidth / 2 - 8,
                inputY - inputHeight / 2 - 8,
                inputWidth + 16,
                inputHeight + 16,
                borderRadius + 4
            );
        }

        // Background
        this.nameInputBg.fillStyle(isFocused ? 0x5FB859 : 0x5FB859, isFocused ? 1 : 0.9);
        this.nameInputBg.fillRoundedRect(
            inputX - inputWidth / 2,
            inputY - inputHeight / 2,
            inputWidth,
            inputHeight,
            borderRadius
        );

        // Border
        this.nameInputBg.lineStyle(borderWidth, isFocused ? 0xFFFFFF : 0xFFD700, 1);
        this.nameInputBg.strokeRoundedRect(
            inputX - inputWidth / 2,
            inputY - inputHeight / 2,
            inputWidth,
            inputHeight,
            borderRadius
        );

        // Inner shadow
        this.nameInputBg.fillStyle(0x2D5016, isFocused ? 0.2 : 0.3);
        this.nameInputBg.fillRoundedRect(
            inputX - inputWidth / 2 + 2,
            inputY - inputHeight / 2 + 2,
            inputWidth - 4,
            inputHeight - 4,
            borderRadius - 2
        );
    }

    focusInput ()
    {
        this.isInputFocused = true;
        this.updateInputBackground(true);
        this.nameInputText.setColor('#FFD700');
        if (this.playerName === '') {
            this.nameInputText.setText('');
        }
        this.startCursorBlink();
    }

    blurInput ()
    {
        this.isInputFocused = false;
        this.updateInputBackground(false);
        this.nameInputText.setColor(this.playerName ? '#FFFFFF' : '#BBBBBB');
        if (this.playerName === '') {
            this.nameInputText.setText('TRAINER');
        }
        this.nameInputCursor.setVisible(false);
        if (this.cursorBlinkTimer) {
            this.cursorBlinkTimer.remove();
            this.cursorBlinkTimer = null;
        }
    }

    startCursorBlink ()
    {
        if (!this.isInputFocused) return;

        if (this.cursorBlinkTimer) {
            this.cursorBlinkTimer.remove();
        }

        this.nameInputCursor.setVisible(true);
        this.updateCursorPosition();

        this.cursorBlinkTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                if (this.nameInputCursor) {
                    this.nameInputCursor.setVisible(!this.nameInputCursor.visible);
                }
            },
            loop: true
        });
    }

    updateCursorPosition ()
    {
        if (!this.nameInputText || !this.nameInputCursor) return;

        const textWidth = this.nameInputText.width;
        const inputX = this.scale.width / 2;
        const cursorX = inputX + textWidth / 2 + 4;
        this.nameInputCursor.setX(cursorX);
    }

    handleKeyDown (event)
    {
        if (!this.isInputFocused) return;

        // Handle Enter key
        if (event.keyCode === 13) { // Enter
            this.changeScene();
            return;
        }

        // Handle Backspace
        if (event.keyCode === 8) { // Backspace
            if (this.playerName.length > 0) {
                this.playerName = this.playerName.slice(0, -1);
                this.updateInputText();
            }
            return;
        }

        // Handle regular character input
        if (event.keyCode >= 32 && event.keyCode <= 126) { // Printable characters
            const char = event.key;
            // Only allow alphanumeric and spaces
            if (/^[A-Za-z0-9 ]$/.test(char) && this.playerName.length < 15) {
                this.playerName += char.toUpperCase();
                this.updateInputText();
            }
        }
    }

    updateInputText ()
    {
        if (this.playerName === '') {
            this.nameInputText.setText('TRAINER');
            this.nameInputText.setColor('#BBBBBB');
        } else {
            this.nameInputText.setText(this.playerName);
            this.nameInputText.setColor(this.isInputFocused ? '#FFD700' : '#FFFFFF');
        }
        this.updateCursorPosition();
    }

    changeScene ()
    {
        // Get player name (already stored in this.playerName)
        this.playerName = this.playerName.trim() || 'Player';

        // Save player name to game state
        gameState.setPlayerName(this.playerName);

        // Emit player name to Vue app
        EventBus.emit('player-name-set', this.playerName);

        // Stop current scene (triggers cleanup) and start Overworld
        this.scene.stop('MainMenu');
        this.scene.start('Overworld', { playerName: this.playerName });
    }
}
