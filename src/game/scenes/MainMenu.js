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
        this.music = null;
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
        // Remove input from DOM
        if (this.nameInput) {
            this.nameInput.remove();
            this.nameInput = null;
        }

        // Double check for any lingering inputs
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
        const logo = this.add.image(this.scale.width / 2, 100, 'logo');
        logo.setScale(0.25);

        // Logo glow effect - golden/sunny glow matching logo
        const logoGlow = this.add.image(this.scale.width / 2, 100, 'logo');
        logoGlow.setScale(0.27);
        logoGlow.setTint(0xFFD700); // Gold color matching logo's warm tones
        logoGlow.setAlpha(0.3);
        logoGlow.setDepth(-1);

        // Logo floating animation
        this.tweens.add({
            targets: [logo, logoGlow],
            y: { from: 100, to: 95 },
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
        this.add.text(this.scale.width / 2, 230, 'BATTLE LENNY\'S PODCAST GUESTS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#FFE066', // Warm yellow from logo
            align: 'center',
            stroke: '#8B4513', // Brown stroke matching logo's wood
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, 275, 'Answer Questions to Win!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '13px',
            color: '#FFFFFF',
            align: 'center',
            stroke: '#2D5016', // Dark green from logo
            strokeThickness: 3
        }).setOrigin(0.5);

        // Name input label - bright green matching logo
        this.add.text(this.scale.width / 2, 345, 'ENTER YOUR NAME:', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#FFD700', // Gold
            letterSpacing: 2,
            stroke: '#2D5016',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Create HTML input for name
        this.createNameInput();

        // Start button - vibrant Pokemon-style
        const buttonY = 500;
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
            fontFamily: '"Press Start 2P"',
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
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            letterSpacing: 1,
            stroke: 'rgba(45, 80, 22, 0.8)',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Global mute/unmute control
        EventBus.on('toggle-mute', (isMuted) => {
            this.sound.mute = isMuted;
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
        // Create HTML input element
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = 'player-name-input';
        inputElement.placeholder = 'TRAINER';
        inputElement.maxLength = 15;
        inputElement.style.position = 'absolute';
        inputElement.style.fontFamily = '"Press Start 2P"';
        inputElement.style.fontSize = '14px';
        inputElement.style.padding = '14px 24px';
        inputElement.style.background = 'rgba(95, 184, 89, 0.9)'; // Green from logo
        inputElement.style.border = '4px solid #FFD700'; // Gold border
        inputElement.style.borderRadius = '14px';
        inputElement.style.color = '#FFFFFF';
        inputElement.style.textAlign = 'center';
        inputElement.style.width = '340px';
        inputElement.style.outline = 'none';
        inputElement.style.letterSpacing = '4px';
        inputElement.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(45, 80, 22, 0.3)';
        inputElement.style.transition = 'all 0.3s ease';

        // Add focus effect
        inputElement.addEventListener('focus', () => {
            inputElement.style.boxShadow = '0 0 35px rgba(255, 215, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.2)';
            inputElement.style.color = '#FFD700';
            inputElement.style.background = 'rgba(95, 184, 89, 1)';
            inputElement.style.borderColor = '#FFF';
        });

        inputElement.addEventListener('blur', () => {
            inputElement.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(45, 80, 22, 0.3)';
            inputElement.style.color = '#FFFFFF';
            inputElement.style.background = 'rgba(95, 184, 89, 0.9)';
            inputElement.style.borderColor = '#FFD700';
        });

        // Position the input based on canvas position
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const canvasScale = rect.width / this.scale.width;
        const inputX = rect.left + (this.scale.width / 2) * canvasScale - 170;
        const inputY = rect.top + 390 * canvasScale;

        inputElement.style.left = inputX + 'px';
        inputElement.style.top = inputY + 'px';
        inputElement.style.zIndex = '1000';

        // Add to DOM
        document.body.appendChild(inputElement);

        // Store reference
        this.nameInput = inputElement;

        // Pre-fill with saved player name if exists
        const savedName = gameState.getPlayerName();
        if (savedName && savedName !== 'Player') {
            inputElement.value = savedName;
        }

        // Focus on load
        setTimeout(() => inputElement.focus(), 100);

        // Allow Enter key to start game
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.changeScene();
            }
        });
    }

    changeScene ()
    {
        // Get player name from input
        if (this.nameInput) {
            this.playerName = this.nameInput.value.trim() || 'Player';
        }

        // Save player name to game state
        gameState.setPlayerName(this.playerName);

        // Emit player name to Vue app
        EventBus.emit('player-name-set', this.playerName);

        // Stop current scene (triggers cleanup) and start Overworld
        this.scene.stop('MainMenu');
        this.scene.start('Overworld', { playerName: this.playerName });
    }
}
