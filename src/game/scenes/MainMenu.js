import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
        this.playerName = '';
    }

    create ()
    {
        // Purple gradient background
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1);
        graphics.fillRect(0, 0, this.scale.width, this.scale.height);

        // Add animated stars in background
        this.createStarfield();

        // Decorative border
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(6, 0xFFD700, 1);
        borderGraphics.strokeRoundedRect(20, 20, this.scale.width - 40, this.scale.height - 40, 16);

        // PokeLenny Title - larger
        const titleText = this.add.text(this.scale.width / 2, 90, 'PokéLenny', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '64px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5);

        // Tagline - larger
        this.add.text(this.scale.width / 2, 170, 'Catch \'Em All!', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Guest preview sprites - larger
        const elena = this.add.sprite(this.scale.width / 2 - 120, 270, 'elena-front');
        elena.setScale(0.2);

        const char = this.add.sprite(this.scale.width / 2 + 120, 270, 'main-front');
        char.setScale(0.2);

        // Info text - larger
        this.add.text(this.scale.width / 2, 360, 'Battle Lenny\'s Podcast Guests\nAnswer Questions to Win!', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '13px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 12
        }).setOrigin(0.5);

        // Name input label - larger
        this.add.text(this.scale.width / 2, 430, 'Enter Your Name:', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '12px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // Create HTML input for name
        this.createNameInput();

        // New Game Button with better styling
        const buttonY = 560;
        const buttonWidth = 300;
        const buttonHeight = 70;

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x000000, 0.8);
        buttonBg.fillRoundedRect(this.scale.width / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 12);

        const newGameButton = this.add.rectangle(this.scale.width / 2, buttonY, buttonWidth - 8, buttonHeight - 8, 0xFFD700)
            .setStrokeStyle(4, 0x000000);

        const newGameText = this.add.text(this.scale.width / 2, buttonY, 'START GAME', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '18px',
            color: '#000000'
        }).setOrigin(0.5);

        // Make button interactive
        newGameButton.setInteractive({ useHandCursor: true });

        newGameButton.on('pointerover', () => {
            newGameButton.setFillStyle(0xFFA500);
            newGameText.setScale(1.05);
        });

        newGameButton.on('pointerout', () => {
            newGameButton.setFillStyle(0xFFD700);
            newGameText.setScale(1);
        });

        newGameButton.on('pointerdown', () => {
            this.changeScene();
        });

        // Version text
        this.add.text(this.scale.width / 2, this.scale.height - 35, 'v0.5 - Built with Phaser 3', {
            fontFamily: 'Press Start 2P, monospace',
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.6)'
        }).setOrigin(0.5);

        EventBus.emit('current-scene-ready', this);
    }

    createStarfield ()
    {
        // Create static stars in background
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(30, this.scale.width - 30);
            const y = Phaser.Math.Between(30, this.scale.height - 30);
            const size = Phaser.Math.Between(1, 2);
            const alpha = Phaser.Math.FloatBetween(0.4, 0.8);
            this.add.circle(x, y, size, 0xFFFFFF, alpha);
        }
    }

    createNameInput ()
    {
        // Create HTML input element
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = 'player-name-input';
        inputElement.placeholder = 'Player';
        inputElement.maxLength = 15;
        inputElement.style.position = 'absolute';
        inputElement.style.fontFamily = "'Press Start 2P', monospace";
        inputElement.style.fontSize = '14px';
        inputElement.style.padding = '14px 20px';
        inputElement.style.background = 'rgba(0, 0, 0, 0.8)';
        inputElement.style.border = '4px solid #FFD700';
        inputElement.style.borderRadius = '8px';
        inputElement.style.color = '#fff';
        inputElement.style.textAlign = 'center';
        inputElement.style.width = '300px';
        inputElement.style.outline = 'none';

        // Position the input based on canvas position
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const canvasScale = rect.width / this.scale.width;
        const inputX = rect.left + (this.scale.width / 2) * canvasScale - 150;
        const inputY = rect.top + 460 * canvasScale;

        inputElement.style.left = inputX + 'px';
        inputElement.style.top = inputY + 'px';
        inputElement.style.zIndex = '1000';

        // Add to DOM
        document.body.appendChild(inputElement);

        // Store reference
        this.nameInput = inputElement;

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
            // Remove input from DOM
            this.nameInput.remove();
        }

        // Emit player name to Vue app
        EventBus.emit('player-name-set', this.playerName);

        // Pass player name to Overworld scene
        this.scene.start('Overworld', { playerName: this.playerName });
    }
}
