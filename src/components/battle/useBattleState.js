import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import gameState from '../../game/GameState.js';
import { EventBus } from '../../game/EventBus';
import { getGuestTitle } from '../../game/GuestTitles.js';
import { getGuestTier } from '../../game/StageConfig.js';

export const useBattleState = (props, emit, swirlCanvas) => {
    const guestHP = ref(100);
    const playerHP = ref(props.playerStats?.hp || 100);
    const playerMaxHP = computed(() => props.playerStats?.maxHp || 100);
    const playerLevel = computed(() => props.playerStats?.level || 1);
    const currentQuestionIndex = ref(0);
    const selectedAnswer = ref(null);
    const selectedAnswerIndex = ref(0);
    const answered = ref(false);
    const isCorrect = ref(false);
    const battleEnded = ref(false);
    const battleWon = ref(false);
    const showTransition = ref(false);

    const battleStats = ref({
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        xpGained: 0,
        hpGained: 0,
        perfectBattle: false,
        bonusCorrect: false
    });
    const hpDelta = ref(0);
    const hpDeltaKey = ref(0);
    let hpDeltaTimer = null;

    const xpDelta = ref(0);
    const xpDeltaKey = ref(0);
    let xpDeltaTimer = null;

    // Boss battle detection - Brian Balfour is the boss
    const isBossBattle = computed(() => {
        return props.battleData?.guest?.name === 'Brian Balfour';
    });

    const xpPerCorrect = computed(() => {
        // Boss battles award 30 XP per correct answer
        if (isBossBattle.value) return 30;
        // Normal scaling: 10-50 XP based on level
        return Math.min(10 + 5 * (playerLevel.value - 1), 50);
    });

    const currentQuestion = computed(() => {
        const questions = props.battleData?.questions;
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            console.warn('No questions available in battleData');
            return { prompt: 'Loading...', choices: [], correctAnswer: 0 };
        }

        const question = questions[currentQuestionIndex.value];
        if (!question) {
            console.warn(`Question at index ${currentQuestionIndex.value} not found`);
            return { prompt: 'Loading...', choices: [], correctAnswer: 0 };
        }

        return question;
    });

    const guestHPPercent = computed(() => {
        return (guestHP.value / (props.battleData?.guest.hp || 100)) * 100;
    });

    const playerHPPercent = computed(() => {
        return (playerHP.value / playerMaxHP.value) * 100;
    });

    const guestHPClass = computed(() => {
        const percent = guestHPPercent.value;
        if (percent > 50) return 'hp-high';
        if (percent > 20) return 'hp-medium';
        return 'hp-low';
    });

    const playerHPClass = computed(() => {
        const percent = playerHPPercent.value;
        if (percent > 50) return 'hp-high';
        if (percent > 20) return 'hp-medium';
        return 'hp-low';
    });

    const opponentLevel = computed(() => {
        const guestLevel = props.battleData?.guest?.level;
        if (Number.isFinite(guestLevel)) return guestLevel;

        // Calculate level based on tier in StageConfig
        const guestName = props.battleData?.guest?.name;
        if (guestName) {
            const tier = getGuestTier(guestName);
            // Level = Tier + 4 (e.g., Tier 1 = Lv5, Tier 28 = Lv32)
            return tier + 4;
        }

        // Fallback to difficulty-based if guest not found
        const difficulty = (props.battleData?.guest?.difficulty || '').toLowerCase();
        if (difficulty.includes('hard')) return 40;
        if (difficulty.includes('medium')) return 35;
        return 30;
    });

    const guestAvatarPath = computed(() => {
        if (!props.battleData?.guest?.name) return null;
        const guestName = props.battleData.guest.name;

        // Special case for Elena - use elena-front.png
        if (guestName.includes('Elena Verna')) {
            return `/assets/elena-front.png`;
        }

        // Transform name to match renamed files (spaces to hyphens, special chars removed)
        const safeName = guestName
            .replace(/\s+/g, '-')
            .replace(/[&+,]/g, '-')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            .replace(/ä/g, 'a')
            .replace(/-+/g, '-');

        return `/assets/avatars/${safeName}_pixel_art.png`;
    });

    const guestTitle = computed(() => {
        if (!props.battleData?.guest?.name) return '';
        return getGuestTitle(props.battleData.guest.name);
    });

    // Keyboard handler for navigation and confirmation
    function handleKeyPress(event) {
        // Only handle keys during battle
        if (!props.isActive || battleEnded.value) return;

        const key = event.key;
        const numChoices = currentQuestion.value.choices?.length || 0;

        // Check if this is a key we want to handle
        const battleKeys = ['ArrowUp', 'ArrowDown', 'Enter', '1', '2', '3', '4'];
        if (!battleKeys.includes(key)) return;

        // Prevent event from reaching the game
        event.preventDefault();
        event.stopPropagation();

        // If showing feedback, Enter to continue
        if (answered.value) {
            if (key === 'Enter') {
                nextQuestion();
            }
            return;
        }

        // Arrow key navigation
        if (key === 'ArrowUp') {
            selectedAnswerIndex.value = Math.max(0, selectedAnswerIndex.value - 1);
        } else if (key === 'ArrowDown') {
            selectedAnswerIndex.value = Math.min(numChoices - 1, selectedAnswerIndex.value + 1);
        }
        // Number keys for direct selection
        else if (key >= '1' && key <= '4') {
            const index = parseInt(key) - 1;
            if (index < numChoices) {
                selectedAnswerIndex.value = index;
            }
        }
        // Enter to confirm
        else if (key === 'Enter') {
            selectAnswer(selectedAnswerIndex.value);
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyPress);
    });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyPress);
    });

    function drawPixelSwirl() {
        if (!swirlCanvas.value) return;

        const canvas = swirlCanvas.value;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const gridSize = 16; // 16x16 grid
        const blockWidth = width / gridSize;
        const blockHeight = height / gridSize;
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;

        let progress = 0;
        const duration = 1200; // 1.2 seconds
        const startTime = Date.now();
        const spiralTurns = 3; // Number of spiral rotations

        function animate() {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);

            // Start with white covering everything
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, width, height);

            // Clear blocks in clockwise spiral pattern to reveal battle background
            for (let gridY = 0; gridY < gridSize; gridY++) {
                for (let gridX = 0; gridX < gridSize; gridX++) {
                    // Calculate angle and distance from center
                    const dx = gridX - centerX + 0.5;
                    const dy = gridY - centerY + 0.5;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Calculate angle starting from top (12 o'clock) going clockwise
                    // atan2 gives angle from right, so we adjust: subtract 90° and reverse direction
                    let angle = Math.atan2(dy, dx);
                    // Convert to start at top and go clockwise
                    angle = -angle + Math.PI / 2;
                    // Normalize to 0-1 range
                    const normalizedAngle = ((angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);

                    // Calculate spiral value (combines angle and distance)
                    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
                    const normalizedDistance = distance / maxDistance;

                    // Spiral formula: sweeps clockwise while moving outward
                    const spiralValue = normalizedAngle + normalizedDistance * spiralTurns;
                    const normalizedSpiral = (spiralValue / spiralTurns);

                    // Clear block (reveal background) when progress passes its spiral position
                    if (normalizedSpiral < progress) {
                        ctx.clearRect(
                            gridX * blockWidth,
                            gridY * blockHeight,
                            blockWidth,
                            blockHeight
                        );
                    }
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        animate();
    }

    watch(() => props.isActive, (newVal) => {
        if (newVal) {
            showTransition.value = true;
            // Start battle music
            EventBus.emit('play-battle-music');

            // Start pixel swirl animation
            setTimeout(() => {
                if (swirlCanvas.value) {
                    // Match canvas size to container
                    const rect = swirlCanvas.value.getBoundingClientRect();
                    swirlCanvas.value.width = rect.width;
                    swirlCanvas.value.height = rect.height;
                    drawPixelSwirl();
                }
            }, 50);

            setTimeout(() => {
                showTransition.value = false;
                resetBattle();
            }, 1200); // 1.2 second transition (matches animation duration)
        } else {
            // Stop battle music when battle screen closes
            EventBus.emit('stop-battle-music');
        }
    });

    watch(() => props.battleData?.questions, (newQuestions, oldQuestions) => {
        console.log('Battle questions changed:', newQuestions?.length, 'questions');
        if (newQuestions && newQuestions !== oldQuestions && props.isActive) {
            // Reset battle state when new questions arrive
            console.log('Resetting battle for new questions');
            resetBattle();
        }
    }, { deep: true });

    function resetBattle() {
        guestHP.value = 100;
        playerHP.value = props.playerStats?.hp || 100;
        currentQuestionIndex.value = 0;
        selectedAnswer.value = null;
        selectedAnswerIndex.value = 0;
        answered.value = false;
        isCorrect.value = false;
        battleEnded.value = false;
        battleWon.value = false;

        // Reset battle stats
        const totalQs = props.battleData?.questions?.length || 0;
        battleStats.value = {
            totalQuestions: totalQs,
            correctAnswers: 0,
            wrongAnswers: 0,
            xpGained: 0,
            hpGained: 0,
            perfectBattle: false,
            bonusCorrect: false
        };

        console.log('Battle reset with', totalQs, 'questions');
    }

    function selectAnswer(index) {
        if (answered.value) return;

        selectedAnswer.value = index;
        answered.value = true;
        isCorrect.value = index === currentQuestion.value.correctAnswer;

        // Track battle stats (totalQuestions is already set in resetBattle, don't increment it)
        if (isCorrect.value) {
            battleStats.value.correctAnswers++;
            let earnedXp = xpPerCorrect.value;
            let bonusHp = 0;

            if (currentQuestion.value.isBonus) {
                earnedXp += 2 * xpPerCorrect.value;
                bonusHp = 10;
                battleStats.value.bonusCorrect = true;
            }

            battleStats.value.xpGained += earnedXp;

            // Show XP gain animation for boss battles
            if (isBossBattle.value) {
                xpDelta.value = earnedXp;
                xpDeltaKey.value += 1;
                if (xpDeltaTimer) {
                    clearTimeout(xpDeltaTimer);
                }
                xpDeltaTimer = setTimeout(() => {
                    xpDelta.value = 0;
                }, 800);
            }

            if (bonusHp > 0) {
                const bonusNewHP = Math.min(playerMaxHP.value, playerHP.value + bonusHp);
                const actualBonus = bonusNewHP - playerHP.value;
                if (actualBonus > 0) {
                    playerHP.value = bonusNewHP;
                    battleStats.value.hpGained += actualBonus;
                    emit('hp-changed', bonusNewHP);
                }
            }
        } else {
            battleStats.value.wrongAnswers++;
            // Boss battles deduct 20 HP, normal battles deduct 10 HP
            const hpPenalty = isBossBattle.value ? 20 : 10;
            const newHP = Math.max(0, playerHP.value - hpPenalty);
            playerHP.value = newHP;
            emit('hp-changed', newHP);
            hpDelta.value = -hpPenalty;
            hpDeltaKey.value += 1;
            if (hpDeltaTimer) {
                clearTimeout(hpDeltaTimer);
            }
            hpDeltaTimer = setTimeout(() => {
                hpDelta.value = 0;
            }, 800);
        }

        // Emit answer result to parent
        emit('answer-submitted', { correct: isCorrect.value, bonus: currentQuestion.value.isBonus });

        setTimeout(() => {
            const totalQuestions = battleStats.value.totalQuestions || 1;
            const guestMax = props.battleData?.guest?.hp || 100;
            const guestDmgPerQ = guestMax / totalQuestions;

            if (isCorrect.value) {
                const nextGuestHP = Math.max(
                    0,
                    guestMax - battleStats.value.correctAnswers * guestDmgPerQ
                );
                guestHP.value = nextGuestHP;
            }
        }, 100);
    }

    function nextQuestion() {
        const totalQuestions = props.battleData?.questions?.length || 1;
        if (currentQuestionIndex.value < totalQuestions - 1) {
            currentQuestionIndex.value++;
            answered.value = false;
            selectedAnswer.value = null;
            selectedAnswerIndex.value = 0;
            isCorrect.value = false;
        } else {
            // Battle ends after all questions - check if player won based on accuracy
            const correct = battleStats.value.correctAnswers;
            const total = battleStats.value.totalQuestions;
            const accuracy = (correct / total) * 100;

            // Win if accuracy is 60% or higher
            // 1 question: must get it right (100%)
            // 2 questions: must get both right (100%)
            // 3 questions: must get at least 2 right (66.7%)
            const won = accuracy >= 60;

            console.log(`Battle ended: ${correct}/${total} correct (${accuracy.toFixed(1)}%) - ${won ? 'WIN' : 'LOSE'}`);
            endBattle(won);
        }
    }

    function endBattle(won) {
        battleEnded.value = true;
        battleWon.value = won;

        // Check for perfect battle (no wrong answers)
        battleStats.value.perfectBattle = won && battleStats.value.wrongAnswers === 0;

        // Perfect kill bonus XP (base XP already counted per correct answer)
        if (battleStats.value.perfectBattle) {
            battleStats.value.xpGained += 3 * xpPerCorrect.value;
        }

        // HP bonus for perfect battle
        if (battleStats.value.perfectBattle) {
            const hpBonus = 20;
            const newHP = Math.min(playerMaxHP.value, playerHP.value + hpBonus);
            const actualHpGained = newHP - playerHP.value;

            if (actualHpGained > 0) {
                playerHP.value = newHP;
                battleStats.value.hpGained += actualHpGained;
                // Emit HP change to sync with global stats
                emit('hp-changed', newHP);
            }
        }

        // Play victory or defeat sound
        if (won) {
            EventBus.emit('play-victory-sound');
        } else {
            EventBus.emit('play-defeat-sound');
        }

        // Record battle result in game state
        if (props.battleData?.guest) {
            gameState.recordBattle({
                guestId: props.battleData.guest.id,
                won: won,
                totalQuestions: battleStats.value.totalQuestions,
                correctAnswers: battleStats.value.correctAnswers,
                wrongAnswers: battleStats.value.wrongAnswers,
                xpGained: battleStats.value.xpGained
            });

            if (won) {
                emit('guest-captured', {
                    guestId: props.battleData.guest.id,
                    xpGained: battleStats.value.xpGained
                });
            }
        }
    }

    function closeBattle() {
        console.log('closeBattle called - emitting close event');
        emit('close');
    }

    function handleRetry() {
        console.log('handleRetry called');
        // Reset battle and restart
        battleEnded.value = false;
        battleWon.value = false;
        resetBattle();
    }

    function handleContinue() {
        console.log('handleContinue called');
        // Close battle screen
        closeBattle();
    }

    return {
        guestHP,
        playerHP,
        playerMaxHP,
        playerLevel,
        currentQuestionIndex,
        selectedAnswer,
        selectedAnswerIndex,
        answered,
        isCorrect,
        battleEnded,
        battleWon,
        showTransition,
        battleStats,
        xpPerCorrect,
        currentQuestion,
        guestHPPercent,
        playerHPPercent,
        guestHPClass,
        playerHPClass,
        hpDelta,
        hpDeltaKey,
        xpDelta,
        xpDeltaKey,
        isBossBattle,
        opponentLevel,
        guestAvatarPath,
        guestTitle,
        selectAnswer,
        nextQuestion,
        closeBattle,
        handleRetry,
        handleContinue
    };
};
