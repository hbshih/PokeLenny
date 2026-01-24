#!/usr/bin/env node

/**
 * Script to add episode URLs from Lenny's Podcast RSS feed to questions.json
 * Matches guests by name and adds URL(s) to each episode entry
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_FEED_URL = 'https://api.substack.com/feed/podcast/10845/private/732360bb-6d5c-458f-8552-38a5354d6f67.rss';
const QUESTIONS_JSON_PATH = path.join(__dirname, '../public/assets/questions.json');

/**
 * Normalize a name for matching (lowercase, remove special chars, extra spaces)
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Extract guest name from episode title
 * Examples:
 * - "The non-technical PM's guide to building with Cursor | Zevi Arnovitz (Meta)" -> "Zevi Arnovitz"
 * - "Julie Zhuo on accelerating your career..." -> "Julie Zhuo"
 * - "Name | Guest Name (Company)" -> "Guest Name"
 */
function extractGuestName(title) {
  if (!title) return null;
  
  // Try pattern: "| Name (Company)" or "| Name"
  const pipeMatch = title.match(/\|\s*([^(|]+?)(?:\s*\([^)]+\))?\s*$/);
  if (pipeMatch) {
    return pipeMatch[1].trim();
  }
  
  // Try pattern: "Name on..." or "Name:..."
  const onMatch = title.match(/^([^|:]+?)\s+(?:on|:)/i);
  if (onMatch) {
    return onMatch[1].trim();
  }
  
  // Try to find name patterns (First Last format)
  const nameMatch = title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/);
  if (nameMatch) {
    return nameMatch[1].trim();
  }
  
  return null;
}

/**
 * Match guest name to episode title
 * Returns similarity score (0-1)
 */
function matchGuestToEpisode(guestName, episodeTitle) {
  const normalizedGuest = normalizeName(guestName);
  const extractedName = extractGuestName(episodeTitle);
  
  if (!extractedName) return 0;
  
  const normalizedExtracted = normalizeName(extractedName);
  
  // Exact match
  if (normalizedGuest === normalizedExtracted) {
    return 1.0;
  }
  
  // Check if guest name is contained in extracted name or vice versa
  if (normalizedExtracted.includes(normalizedGuest) || normalizedGuest.includes(normalizedExtracted)) {
    return 0.9;
  }
  
  // Check if last name matches
  const guestParts = normalizedGuest.split(' ');
  const extractedParts = normalizedExtracted.split(' ');
  
  if (guestParts.length > 1 && extractedParts.length > 1) {
    const guestLast = guestParts[guestParts.length - 1];
    const extractedLast = extractedParts[extractedParts.length - 1];
    if (guestLast === extractedLast && guestLast.length > 2) {
      return 0.8;
    }
  }
  
  return 0;
}

/**
 * Fetch RSS feed and parse episodes
 */
function fetchRSSFeed() {
  return new Promise((resolve, reject) => {
    https.get(RSS_FEED_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Parse XML (simple regex-based parsing for RSS)
        const episodes = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        
        while ((match = itemRegex.exec(data)) !== null) {
          const itemContent = match[1];
          
          // Extract title
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
          const title = titleMatch ? titleMatch[1] : null;
          
          // Extract link
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
          const link = linkMatch ? linkMatch[1] : null;
          
          if (title && link) {
            episodes.push({ title, url: link });
          }
        }
        
        resolve(episodes);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Match episodes to guests and add URLs
 */
function addUrlsToGuests(questionsData, episodes) {
  let matchedCount = 0;
  let multipleEpisodesCount = 0;
  
  questionsData.episodes.forEach((episode) => {
    const guestName = episode.guest || episode.title;
    const matches = [];
    
    // Find all matching episodes
    episodes.forEach((ep) => {
      const score = matchGuestToEpisode(guestName, ep.title);
      if (score >= 0.8) {
        matches.push({ ...ep, score });
      }
    });
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);
    
    if (matches.length > 0) {
      // Add URL(s) to episode
      if (matches.length === 1) {
        episode.url = matches[0].url;
      } else {
        episode.urls = matches.map(m => m.url);
        episode.url = matches[0].url; // Keep single url for backward compatibility
        multipleEpisodesCount++;
      }
      matchedCount++;
      
      // Log match for verification
      console.log(`✓ Matched "${guestName}" to "${matches[0].title}" (${matches.length} episode${matches.length > 1 ? 's' : ''})`);
    } else {
      console.warn(`✗ No match found for "${guestName}"`);
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- Matched: ${matchedCount}/${questionsData.episodes.length} guests`);
  console.log(`- Multiple episodes: ${multipleEpisodesCount} guests`);
  
  return questionsData;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Fetching RSS feed...');
    const episodes = await fetchRSSFeed();
    console.log(`Found ${episodes.length} episodes in RSS feed\n`);
    
    console.log('Loading questions.json...');
    const questionsData = JSON.parse(fs.readFileSync(QUESTIONS_JSON_PATH, 'utf8'));
    console.log(`Found ${questionsData.episodes.length} guests in questions.json\n`);
    
    console.log('Matching episodes to guests...\n');
    const updatedData = addUrlsToGuests(questionsData, episodes);
    
    // Write back to file
    console.log('\nWriting updated questions.json...');
    fs.writeFileSync(
      QUESTIONS_JSON_PATH,
      JSON.stringify(updatedData, null, 2),
      'utf8'
    );
    
    console.log('✓ Done! Episode URLs have been added to questions.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
