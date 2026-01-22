import { Scene } from 'phaser';
import WebFont from 'webfontloader';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');

        // Load web fonts before anything else
        this.fontsReady = false;

        WebFont.load({
            google: {
                families: ['Pixelify Sans']
            },
            active: () => {
                this.fontsReady = true;
            },
            inactive: () => {
                // Font failed to load, continue anyway
                this.fontsReady = true;
            }
        });
    }

    create ()
    {
        // Wait for fonts to be ready before starting Preloader
        const checkFonts = () => {
            if (this.fontsReady) {
                this.scene.start('Preloader');
            } else {
                this.time.delayedCall(50, checkFonts);
            }
        };

        checkFonts();
    }
}
