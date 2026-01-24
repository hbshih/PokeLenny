import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Overworld } from './scenes/Overworld';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import Phaser from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    parent: 'game-container',
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 640,
        min: {
            width: 320,
            height: 213
        },
        max: {
            width: 1920,
            height: 1280
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Overworld,
        Game,
        GameOver
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });
}

export default StartGame;
