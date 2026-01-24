/**
 * GuestData.js
 * Handles loading and processing guest data from questions.json and avatar images
 */

class GuestDataManager {
  constructor() {
    this.allGuests = [];
    this.selectedGuests = [];
  }

  /**
   * Load and process questions.json data
   * @param {Object} questionsData - Parsed JSON from questions.json
   * @returns {Array} Array of all available guests with their data
   */
  loadQuestionsData(questionsData) {
    const guests = [];

    if (!questionsData || !questionsData.episodes) {
      console.error('Invalid questions data format');
      return guests;
    }

    questionsData.episodes.forEach((episode, index) => {
      const guestName = episode.guest || episode.title;

      // Check if guest has questions
      if (!episode.questions || episode.questions.length === 0) {
        console.warn(`Guest ${guestName} has no questions, skipping`);
        return;
      }

      // Create guest object
      const guest = {
        id: String(index + 1).padStart(3, '0'),
        name: guestName,
        episode: episode.title,
        episodeUrl: episode.url || '',
        questions: episode.questions,
        avatarKey: this.generateAvatarKey(guestName),
        sprite: null, // Default sprite icon handled in UI
        difficulty: this.calculateDifficulty(episode.questions.length),
        captured: false
      };

      guests.push(guest);
    });

    this.allGuests = guests;
    console.log(`Loaded ${guests.length} guests from questions.json`);
    return guests;
  }

  /**
   * Generate asset key for avatar image
   * @param {string} guestName - Name of the guest
   * @returns {string} Asset key for Phaser loader
   */
  generateAvatarKey(guestName) {
    // Clean the name first (remove version numbers, etc.)
    const cleanName = this.cleanGuestName(guestName);
    // Convert "Ada Chen Rekhi" to "ada-chen-rekhi" for asset key
    // Also clean up special characters
    return `avatar-${cleanName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[&+]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}`;
  }

  /**
   * Clean guest name for avatar file matching
   * @param {string} guestName - Name of the guest
   * @returns {string} Cleaned name
   */
  cleanGuestName(guestName) {
    // Remove version numbers like " 2.0", " 3.0", etc.
    let cleaned = guestName.replace(/\s+\d+\.\d+$/, '');
    // Remove trailing underscore if any
    cleaned = cleaned.replace(/_$/, '');
    return cleaned.trim();
  }

  /**
   * Generate file path for avatar image
   * @param {string} guestName - Name of the guest
   * @returns {string} Path to avatar file
   */
  generateAvatarPath(guestName) {
    // Special case for Elena - use elena-front.png
    if (guestName.includes('Elena Verna')) {
      return 'elena-front.png';
    }

    // Handle collaboration episodes - use first person's avatar
    const collaborationMappings = {
      'Keith Coleman & Jay Baxter': 'Keith Coleman',
      'Jake Knapp + John Zeratsky': 'John Zeratsky',
      'Melissa Perri + Denise Tilles': 'Melissa Perri',
      'Hamel Husain & Shreya Shankar': 'Hamel Husain & Shreya Shankar', // This one exists
      'Aishwarya Naresh Reganti + Kiriti Badam': null, // No avatar
      'Sriram and Aarthi': 'Sriram and Aarthi' // This one exists
    };

    // Handle special episodes/variations
    const specialMappings = {
      'Shreyas Doshi Live': 'Shreyas Doshi',
      'Yuhki Yamashata': 'Yuhki Yamashita',
      'Melissa': 'Melissa Perri', // Use Melissa Perri for standalone "Melissa"
      'EOY Review': null,
      'Interview Q Compilation': null,
      'Teaser_2021': null,
      'Failure': 'Failure', // This one exists
      // Non-people/compilations (exclude)
      'EOY Review': null,
      'Interview Q Compilation': null,
      'Teaser_2021': null,
      // Missing avatars
      'Dr. Fei Fei Li': 'Dr. Fei-Fei Li',
      'Gia Laudi': 'Georgiana Laudi',
      'Chip Conley': 'Chip Conley',
      'Cam Adams': 'Cameron Adams',
      'Benjamin Mann': 'Benjamin Mann',
      'Alex Hardimen': 'Alex Hardiman',
      'Phyl Terry': 'Phyl Terry',
      'Jeanne Grosser': 'Jeanne DeWitt Grosser',
      'Jess Lachs': 'Jessica Lachs',
      'Jason M Lemkin': 'Jason Lemkin',
      'Mike Maples Jr': 'Mike Maples, Jr.'
    };

    // Check collaboration mappings first
    for (const [collab, replacement] of Object.entries(collaborationMappings)) {
      if (guestName.includes(collab)) {
        if (replacement === null) {
          return null; // No avatar available
        }
        const cleanName = this.cleanGuestName(replacement);
        return `avatars/${cleanName}_pixel_art.png`;
      }
    }

    // Check special mappings
    for (const [special, replacement] of Object.entries(specialMappings)) {
      if (guestName === special || guestName.includes(special)) {
        if (replacement === null) {
          return null; // No avatar available
        }
        const cleanName = this.cleanGuestName(replacement);
        return `avatars/${cleanName}_pixel_art.png`;
      }
    }

    // Clean the name first (remove version numbers, etc.)
    const cleanName = this.cleanGuestName(guestName);

    // URL-encode the filename to handle special characters like ö, ü, etc.
    // This ensures files like "Gustav Söderström" load correctly
    const fileName = `${cleanName}_pixel_art.png`;
    const encodedFileName = encodeURIComponent(fileName);

    return `avatars/${encodedFileName}`;
  }

  /**
   * Calculate difficulty based on number of questions
   * @param {number} questionCount - Number of questions for this guest
   * @returns {string} Difficulty level
   */
  calculateDifficulty(questionCount) {
    if (questionCount <= 3) return 'Easy';
    if (questionCount <= 6) return 'Medium';
    return 'Hard';
  }

  /**
   * Top 20 most famous/popular guests that should always appear
   */
  getTopGuests() {
    return [
      'Elena Verna',
      'Shreyas Doshi',
      'Casey Winters',
      'April Dunford',
      'Marty Cagan',
      'Julie Zhuo',
      'Nir Eyal',
      'Des Traynor',
      'Melissa Perri',
      'Lenny Rachitsky',
      'Reforge',
      'Adam Fishman',
      'Bangaly Kaba',
      'Fareed Mosavat',
      'Gokul Rajaram',
      'Ken Norton',
      'Merci Grace',
      'Ravi Mehta',
      'Jackie Bavaro',
      'Hubert Palan'
    ];
  }

  /**
   * Select ALL guests without any filtering (for fixed stage system)
   * @returns {Array} Array of all guests
   */
  selectAllGuestsForFixedStages() {
    if (this.allGuests.length === 0) {
      console.error('No guests loaded. Call loadQuestionsData first.');
      return [];
    }

    // Simply use all guests as-is, maintaining their original IDs and order
    this.selectedGuests = this.allGuests.map(guest => ({ ...guest }));

    console.log(`Selected all ${this.selectedGuests.length} guests for fixed stage system`);
    return this.selectedGuests;
  }

  /**
   * Select N random guests from all available guests
   * Top 20 most famous guests are always included
   * @param {number} count - Number of guests to select (default 30)
   * @returns {Array} Array of selected guests
   */
  selectRandomGuests(count = 30) {
    if (this.allGuests.length === 0) {
      console.error('No guests loaded. Call loadQuestionsData first.');
      return [];
    }

    const selected = [];
    const topGuestNames = this.getTopGuests();

    // First, add the top 20 famous guests
    const topGuests = this.allGuests.filter(guest =>
      topGuestNames.some(name => guest.name.includes(name))
    );

    console.log(`Found ${topGuests.length} top guests from list of ${topGuestNames.length}`);

    // Find Elena and ensure she's first
    const elenaIndex = topGuests.findIndex(g => g.name.includes('Elena Verna'));
    if (elenaIndex > -1) {
      // Remove Elena from her current position
      const elena = topGuests.splice(elenaIndex, 1)[0];
      // Add Elena first
      selected.push({ ...elena });
    }

    // Add remaining top guests
    topGuests.forEach(guest => {
      selected.push({ ...guest });
    });

    // Calculate how many more guests we need
    const remainingCount = count - selected.length;

    if (remainingCount > 0) {
      // Get guests that are NOT in the top list
      const otherGuests = this.allGuests.filter(guest =>
        !topGuestNames.some(name => guest.name.includes(name))
      );

      // Shuffle and select random guests from the remaining pool
      const shuffled = [...otherGuests].sort(() => Math.random() - 0.5);
      const randomGuests = shuffled.slice(0, Math.min(remainingCount, shuffled.length));

      randomGuests.forEach(guest => {
        selected.push({ ...guest });
      });
    }

    // Reassign IDs based on selection order
    selected.forEach((guest, index) => {
      guest.id = String(index + 1).padStart(3, '0');
    });

    this.selectedGuests = selected;
    console.log(`Selected ${selected.length} guests: ${topGuests.length + 1} top guests (Elena first) + ${selected.length - topGuests.length - 1} random guests`);
    return selected;
  }

  /**
   * Get list of avatar paths to preload
   * @returns {Array} Array of {key, path} objects for Phaser loader
   */
  getAvatarsToLoad() {
    return this.selectedGuests
      .map(guest => ({
        key: guest.avatarKey,
        path: this.generateAvatarPath(guest.name),
        guestName: guest.name
      }))
      .filter(avatar => avatar.path !== null); // Skip guests without avatars
  }

  /**
   * Get random questions for a specific guest
   * @param {string} guestId - ID of the guest
   * @param {number} count - Number of questions to get (default 5)
   * @returns {Array} Array of question objects
   */
  getRandomQuestions(guestId, count = 5) {
    const guest = this.selectedGuests.find(g => g.id === guestId);

    if (!guest || !guest.questions || guest.questions.length === 0) {
      console.error(`No questions found for guest ${guestId}`);
      return [];
    }

    // If guest has fewer questions than requested, return all
    if (guest.questions.length <= count) {
      return [...guest.questions];
    }

    // Randomly select 'count' questions
    const shuffled = [...guest.questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get a random question for a specific guest (single question)
   * @param {string} guestId - ID of the guest
   * @returns {Object} Question object with question, options, and answer
   */
  getRandomQuestion(guestId) {
    const questions = this.getRandomQuestions(guestId, 1);
    return questions.length > 0 ? questions[0] : null;
  }

  /**
   * Get guest data by ID
   * @param {string} guestId - ID of the guest
   * @returns {Object} Guest object
   */
  getGuest(guestId) {
    return this.selectedGuests.find(g => g.id === guestId);
  }

  /**
   * Get all loaded guests (all 283 from questions.json)
   * @returns {Array} Array of all guest objects
   */
  getAllGuests() {
    return this.allGuests;
  }

  /**
   * Get all selected guests
   * @returns {Array} Array of selected guest objects
   */
  getSelectedGuests() {
    return this.selectedGuests;
  }

  /**
   * Reset the selection (for new game)
   */
  reset() {
    this.selectedGuests = [];
  }
}

// Create singleton instance
const guestDataManager = new GuestDataManager();

export default guestDataManager;
