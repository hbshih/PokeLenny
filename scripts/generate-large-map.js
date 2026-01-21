// Script to create a larger map by tiling the original tuxemon map
// Simple 3x3 tiling for 120x120 total map

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the original tuxemon town map
const originalMapPath = path.join(__dirname, '../public/assets/tuxemon-town.json');
const originalMap = JSON.parse(fs.readFileSync(originalMapPath, 'utf8'));

const TILE_MULTIPLIER = 3; // Tile the map 3x3
const ORIG_WIDTH = originalMap.width;
const ORIG_HEIGHT = originalMap.height;
const NEW_WIDTH = ORIG_WIDTH * TILE_MULTIPLIER;
const NEW_HEIGHT = ORIG_HEIGHT * TILE_MULTIPLIER;

// Function to tile a layer data array
function tileLayerData(originalData, origWidth, origHeight, multiplier) {
    const newWidth = origWidth * multiplier;
    const newHeight = origHeight * multiplier;
    const newData = new Array(newWidth * newHeight).fill(0);

    for (let ty = 0; ty < multiplier; ty++) {
        for (let tx = 0; tx < multiplier; tx++) {
            for (let y = 0; y < origHeight; y++) {
                for (let x = 0; x < origWidth; x++) {
                    const origIndex = y * origWidth + x;
                    const newX = tx * origWidth + x;
                    const newY = ty * origHeight + y;
                    const newIndex = newY * newWidth + newX;
                    newData[newIndex] = originalData[origIndex];
                }
            }
        }
    }

    return newData;
}

// Tile IDs for common obstacles
const OBSTACLE_TILES = [
    169, 170, 193, 194, // Trees
    197, // Rocks
    174, // Water
];

// Randomly remove trees and obstacles
function removeRandomObstacles(layerData, width, height, removalRate = 0.4) {
    for (let i = 0; i < layerData.length; i++) {
        const tile = layerData[i];
        // If it's an obstacle tile, randomly remove it
        if (OBSTACLE_TILES.includes(tile) && Math.random() < removalRate) {
            layerData[i] = 0;
        }
    }
    return layerData;
}

// Clear obstacles at tile boundaries to create pathways
function createPathways(layerData, width, height, origWidth, origHeight) {
    // Create vertical pathways between tiles (every origWidth tiles)
    for (let tx = 1; tx < TILE_MULTIPLIER; tx++) {
        const pathX = tx * origWidth;
        // Create a 5-tile wide pathway (wider for better flow)
        for (let x = pathX - 2; x <= pathX + 2; x++) {
            if (x >= 0 && x < width) {
                for (let y = 0; y < height; y++) {
                    const index = y * width + x;
                    // Clear collision tiles in World layer (set to 0)
                    layerData[index] = 0;
                }
            }
        }
    }

    // Create horizontal pathways between tiles (every origHeight tiles)
    for (let ty = 1; ty < TILE_MULTIPLIER; ty++) {
        const pathY = ty * origHeight;
        // Create a 5-tile wide pathway
        for (let y = pathY - 2; y <= pathY + 2; y++) {
            if (y >= 0 && y < height) {
                for (let x = 0; x < width; x++) {
                    const index = y * width + x;
                    // Clear collision tiles
                    layerData[index] = 0;
                }
            }
        }
    }

    return layerData;
}

// Add pathways to Below layer
function addPathwayTiles(layerData, width, height, origWidth, origHeight) {
    const TILES = {
        PATH: 173
    };

    // Add vertical path tiles
    for (let tx = 1; tx < TILE_MULTIPLIER; tx++) {
        const pathX = tx * origWidth;
        for (let y = 0; y < height; y++) {
            const index = y * width + pathX;
            layerData[index] = TILES.PATH;
        }
    }

    // Add horizontal path tiles
    for (let ty = 1; ty < TILE_MULTIPLIER; ty++) {
        const pathY = ty * origHeight;
        for (let x = 0; x < width; x++) {
            const index = pathY * width + x;
            layerData[index] = TILES.PATH;
        }
    }

    return layerData;
}

// Generate the map
function generateMap() {
    const newLayers = originalMap.layers.map((layer, idx) => {
        if (layer.type === 'tilelayer') {
            let data = tileLayerData(layer.data, ORIG_WIDTH, ORIG_HEIGHT, TILE_MULTIPLIER);

            return {
                ...layer,
                data: data,
                width: NEW_WIDTH,
                height: NEW_HEIGHT
            };
        }
        return layer;
    });

    return {
        ...originalMap,
        height: NEW_HEIGHT,
        width: NEW_WIDTH,
        layers: newLayers
    };
}

// Write the map file
const mapData = generateMap();
const outputPath = path.join(__dirname, '../public/assets/pokelenny-large-map.json');
fs.writeFileSync(outputPath, JSON.stringify(mapData, null, 2));

console.log(`Generated large map (${NEW_WIDTH}x${NEW_HEIGHT}) at ${outputPath}`);
console.log(`Original map: ${ORIG_WIDTH}x${ORIG_HEIGHT}`);
console.log(`Tiled ${TILE_MULTIPLIER}x${TILE_MULTIPLIER} = ${TILE_MULTIPLIER * TILE_MULTIPLIER} towns`);
console.log(`Total tiles: ${NEW_WIDTH * NEW_HEIGHT}`);
console.log(`Estimated NPC capacity: ~300 NPCs`);
