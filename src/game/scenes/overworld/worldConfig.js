export const WORLD_CONFIGS = [
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

export const getMaxWorldLevel = (segmentsPerWorld) => WORLD_CONFIGS.length * segmentsPerWorld;
