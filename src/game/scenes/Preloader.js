import { Scene } from 'phaser';
import guestDataManager from '../GuestData';
import { EventBus } from '../EventBus';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
        this.questionsLoaded = false;
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game
        this.load.setPath('assets');
        this.desertAssetsLoaded = true;

        this.load.image('logo', 'logo.png');

        // Load Tuxemon tileset and tilemaps (using extruded version to prevent texture bleeding)
        this.load.image('tiles', 'tuxmon-sample-32px-extruded.png');
        this.load.tilemapTiledJSON('map', 'tuxemon-town.json');
        this.load.tilemapTiledJSON('large-map', 'pokelenny-large-map.json');

        // Load character sprites - all angles
        this.load.image('main-front', 'main-front.png');
        this.load.image('main-back', 'main-back.png');
        this.load.image('main-left', 'main-left.png');
        this.load.image('main-right', 'main-right.png');
        this.load.image('elena-front', 'elena-front.png');
        this.load.image('elena-side', 'elena-side.png');

        // Load battle background
        this.load.image('battle-bg', 'battle-background.png');

        // Load audio files
        this.load.audio('menu-music', 'audio/music/menu-theme.ogg');
        this.load.audio('overworld-music', 'audio/music/overworld-theme.ogg');
        this.load.audio('desert-music', 'audio/music/desert-theme.mp3');
        this.load.audio('town-music', 'audio/music/town-theme.ogg');
        this.load.audio('battle-music', 'audio/music/battle-theme.ogg');
        this.load.audio('battle-music-intense', 'audio/music/battle-theme-intense.ogg');
        this.load.audio('boss-battle-music', 'audio/music/boss-battle-theme.ogg');
        this.load.audio('victory-fanfare', 'audio/music/victory-fanfare.ogg');
        this.load.audio('victory-music', 'audio/music/victory-theme.ogg');
        this.load.audio('victory-music-full', 'audio/music/victory-theme-full.ogg');
        this.load.audio('defeat-music', 'audio/music/defeat-theme.ogg');

        // Load questions.json
        this.load.json('questions', 'questions.json');

        // Additional maps - load locally when available
        // World 2 (Desert) - alternates with World 1 (Tuxemon)
        this.load.image('desert-tiles', 'tilemaps/tmw_desert_spacing.png');
        this.load.tilemapTiledJSON('desert-map', 'tilemaps/desert.json');

        this.load.on('loaderror', (file) => {
            if (file?.key === 'desert-map' || file?.key === 'desert-tiles') {
                this.desertAssetsLoaded = false;
            }
        });

        // Set up callback for when questions.json loads
        this.load.once('complete', () => {
            const desertReady = this.desertAssetsLoaded
                && this.cache.tilemap.exists('desert-map')
                && this.textures.exists('desert-tiles');
            this.registry.set('desertAssetsLoaded', desertReady);

            this.loadGuestData();
        });
    }

    loadGuestData ()
    {
        if (this.questionsLoaded) return;
        this.questionsLoaded = true;

        console.log('Loading guest data...');

        // Get questions data from cache
        const questionsData = this.cache.json.get('questions');

        if (!questionsData) {
            console.error('Failed to load questions.json');
            return;
        }

        console.log('Questions data loaded:', questionsData.episodes ? questionsData.episodes.length : 0, 'episodes');

        // Process questions and select ALL guests for fixed stage system
        guestDataManager.loadQuestionsData(questionsData);
        guestDataManager.selectAllGuestsForFixedStages(); // Load all 283 guests

        // Load avatar images for selected guests
        const avatarsToLoad = guestDataManager.getAvatarsToLoad();

        console.log(`Queueing ${avatarsToLoad.length} avatar images for loading...`);

        // Handle missing avatars gracefully
        this.load.on('loaderror', (file) => {
            if (file.key && file.key.startsWith('avatar-')) {
                console.warn(`Avatar not found: ${file.src}, will use fallback`);
            }
        });

        avatarsToLoad.forEach(avatar => {
            // Try to load the avatar, but don't fail if it doesn't exist
            this.load.image(avatar.key, avatar.path);
        });

        // Start loading the avatars if there are any
        if (avatarsToLoad.length > 0) {
            console.log('Starting avatar image loading...');
            this.load.once('complete', () => {
                console.log('Avatar loading complete!');
                // Emit event to notify that guests are ready
                EventBus.emit('guests-loaded', guestDataManager.getSelectedGuests());
                this.scene.start('MainMenu');
            });
            this.load.start();
        } else {
            console.warn('No avatars to load');
            this.scene.start('MainMenu');
        }
    }

    create ()
    {
        // This will only be called if no avatars need to be loaded
        // Otherwise loadGuestData handles the scene transition
        if (!this.questionsLoaded) {
            console.log('Preloader create called without guest data');
            this.scene.start('MainMenu');
        }
    }
}
