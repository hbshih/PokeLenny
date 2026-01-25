import { getMaxWorldLevel } from './worldConfig';

export const updateSegmentView = (scene) => {
    if (!scene.map || !scene.cameras?.main) return;
    if (scene.sys?.isDestroyed || !scene.sys?.isActive()) return;
    const availableLevel = Math.min(scene.unlockedLevel, getMaxWorldLevel(scene.segmentsPerWorld));
    const unlockedSegments = Math.max(1, Math.min(availableLevel - (scene.currentWorld * scene.segmentsPerWorld), scene.segmentsPerWorld));
    const heightTiles = unlockedSegments * scene.segmentHeight;
    const heightPx = heightTiles * scene.map.tileHeight;
    const widthPx = scene.segmentWidth * scene.map.tileWidth;

    scene.cameras.main.setBounds(0, 0, widthPx, heightPx);
    if (scene.minimap) {
        scene.minimap.setBounds(0, 0, widthPx, heightPx);
    }

    updateSegmentLabel(scene);
};

export const createSegmentLabel = (scene) => {
    scene.segmentLabel = scene.add.text(12, 12, '', {
        fontSize: '10px',
        fontFamily: 'Press Start 2P, monospace',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3
    });
    scene.segmentLabel.setScrollFactor(0);
    scene.segmentLabel.setDepth(2000);
    updateSegmentLabel(scene);
};

export const updateSegmentLabel = (scene) => {
    if (!scene.segmentLabel || !scene.segmentLabel.active) return;
    if (scene.sys?.isDestroyed || !scene.sys?.isActive()) return;
    const current = scene.currentLevel;
    const totalUnlocked = scene.unlockedLevel;
    scene.segmentLabel.setText(`Map ${current} / ${totalUnlocked}`);
};

export const showLockedMessage = (scene, messageOverride) => {
    if (scene.sys?.isDestroyed || !scene.sys?.isActive()) {
        return;
    }
    const message = messageOverride || 'Area locked — level up to continue';
    if (!scene.lockedText || !scene.lockedText.active || scene.lockedText.scene !== scene) {
        scene.lockedText = scene.add.text(scene.scale.width / 2, 40, message, {
            fontSize: '10px',
            fontFamily: 'Press Start 2P, monospace',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        scene.lockedText.setOrigin(0.5);
        scene.lockedText.setScrollFactor(0);
        scene.lockedText.setDepth(2000);
    } else {
        scene.lockedText.setText(message);
        scene.lockedText.setAlpha(1);
        scene.lockedText.setVisible(true);
    }

    if (scene.lockedMessageTimer) {
        scene.lockedMessageTimer.remove(false);
    }
    scene.lockedMessageTimer = scene.time.delayedCall(1200, () => {
        if (scene.lockedText) {
            scene.lockedText.setAlpha(0);
            scene.lockedText.setVisible(false);
        }
    });
};
