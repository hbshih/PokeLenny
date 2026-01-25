import { getTotalStages } from '../../StageConfig';
import { getMaxWorldLevel, WORLD_CONFIGS } from './worldConfig';

export const handleDebugKeys = (scene, time) => {
    const debugCooldown = 400;
    if (scene.keys?.L?.isDown && time - (scene.lastDebugUnlockTime || 0) > debugCooldown) {
        scene.lastDebugUnlockTime = time;
        const totalStages = getTotalStages();
        if (scene.unlockedLevel < totalStages) {
            scene.unlockedLevel += 1;
            scene.updateSegmentView();
            scene.updateSegmentLabel();
            console.log(`[debug] L pressed: unlockedLevel -> ${scene.unlockedLevel}`);
            scene.showLockedMessage(`Map ${scene.unlockedLevel} unlocked`);
        }
    }
    if (scene.keys?.J?.isDown && time - (scene.lastDebugJumpTime || 0) > debugCooldown) {
        scene.lastDebugJumpTime = time;
        const totalStages = getTotalStages();
        const maxLevelAvailable = Math.min(totalStages, getMaxWorldLevel(scene.segmentsPerWorld));
        const targetLevel = Math.min(scene.unlockedLevel, maxLevelAvailable);
        const targetWorld = Math.floor((targetLevel - 1) / scene.segmentsPerWorld);
        const targetSegment = (targetLevel - 1) % scene.segmentsPerWorld;
        console.log(`[debug] J pressed: targetLevel=${targetLevel} world=${targetWorld} segment=${targetSegment}`);
        if (targetWorld >= WORLD_CONFIGS.length) {
            scene.showLockedMessage('New map coming soon');
            return true;
        }
        if (!scene.isWorldAvailable(targetWorld)) {
            scene.showLockedMessage('New map coming soon');
            return true;
        }
        scene.scene.restart({
            playerName: scene.playerName,
            map: WORLD_CONFIGS[targetWorld].key,
            worldIndex: targetWorld,
            segmentIndex: targetSegment,
            level: targetLevel,
            unlockedLevel: Math.max(scene.unlockedLevel, targetLevel),
            spawnX: 6,
            spawnY: 4
        });
        return true;
    }

    return false;
};
