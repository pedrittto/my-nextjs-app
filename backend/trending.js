/**
 * Trending analysis module
 * Analyzes articles to find trending topics and selects the most relevant ones
 * Enhanced to support multi-word phrases (bigrams, trigrams, 4-grams)
 */

const logger = require('./logger');

// Topic keywords from the original n8n workflow
const TOPIC_KEYWORDS = new Set([
  'war', 'conflict', 'attack', 'battle', 'military', 'defense',
  'ceasefire', 'invasion', 'troops', 'weapon', 'sanctions',
  'diplomacy', 'politics', 'election', 'president', 'nato',
  'china', 'russia', 'united', 'states'
]);

// Stop words for filtering
const STOP_WORDS = new Set([
  'and', 'the', 'of', 'to', 'in', 'on', 'is', 'a', 'for', 'with',
  'that', 'this', 'are', 'as', 'at', 'be', 'by', 'from', 'has',
  'he', 'it', 'its', 'may', 'not', 'or', 'she', 'was', 'will',
  'would', 'you', 'your', 'they', 'them', 'their', 'we', 'our',
  'us', 'i', 'me', 'my', 'but', 'if', 'so', 'than', 'then', 'up',
  'out', 'do', 'go', 'get', 'got', 'have', 'had', 'has', 'can',
  'could', 'should', 'would', 'might', 'must', 'shall', 'about',
  'after', 'against', 'between', 'during', 'into', 'through',
  'until', 'before', 'behind', 'below', 'beneath', 'beside',
  'beyond', 'inside', 'outside', 'under', 'over', 'above'
]);

// Generic single-word topics that should be avoided unless part of multi-word phrases
const GENERIC_SINGLE_WORDS = new Set([
  'president', 'trump', 'biden', 'war', 'conflict', 'election',
  'russia', 'ukraine', 'china', 'israel', 'palestine', 'nato',
  'economy', 'market', 'trade', 'tariff', 'inflation'
]);

// Special trend thresholds for high-frequency keywords that need stricter filtering
// These keywords require higher article counts and source diversity to qualify as trends
// TEMPORARY: Lowered thresholds for debug – revert after test
// ADJUSTED: Lowered thresholds to increase chances of generating trending news cards
// EXPANDED: Dramatically expanded to cover current global events and regions (2024-2025)
const SPECIAL_TREND_THRESHOLDS = {
  // US Politics - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'trump': { minCount: 8, minSources: 2, description: 'US Politics - Trump' }, // TEMPORARY: 20→8, 3→2
  'biden': { minCount: 8, minSources: 2, description: 'US Politics - Biden' }, // TEMPORARY: 20→8, 3→2
  'president': { minCount: 8, minSources: 2, description: 'US Politics - President' }, // TEMPORARY: 20→8, 3→2
  'white house': { minCount: 8, minSources: 2, description: 'US Politics - White House' }, // TEMPORARY: 18→8, 3→2
  'usa': { minCount: 8, minSources: 2, description: 'US Politics - USA' }, // TEMPORARY: 15→8, 3→2
  'us': { minCount: 8, minSources: 2, description: 'US Politics - US' }, // TEMPORARY: 15→8, 3→2
  'united': { minCount: 8, minSources: 2, description: 'US Politics - United' }, // TEMPORARY: 15→8, 3→2
  'states': { minCount: 8, minSources: 2, description: 'US Politics - States' }, // TEMPORARY: 15→8, 3→2
  
  // Trade/Tariffs - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'tariff': { minCount: 8, minSources: 2, description: 'Trade - Tariffs' }, // TEMPORARY: 18→8, 3→2
  'tariffs': { minCount: 8, minSources: 2, description: 'Trade - Tariffs' }, // TEMPORARY: 18→8, 3→2
  'trade': { minCount: 8, minSources: 2, description: 'Trade - General' }, // TEMPORARY: 15→8, 3→2
  'commerce': { minCount: 8, minSources: 2, description: 'Trade - Commerce' }, // TEMPORARY: 15→8, 3→2
  
  // High-frequency geopolitical topics - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'russia': { minCount: 8, minSources: 2, description: 'Geopolitics - Russia' }, // TEMPORARY: 20→8, 3→2
  'ukraine': { minCount: 8, minSources: 2, description: 'Geopolitics - Ukraine' }, // TEMPORARY: 20→8, 3→2
  'china': { minCount: 8, minSources: 2, description: 'Geopolitics - China' }, // TEMPORARY: 20→8, 3→2
  'putin': { minCount: 8, minSources: 2, description: 'Geopolitics - Putin' }, // TEMPORARY: 18→8, 3→2
  'zelensky': { minCount: 8, minSources: 2, description: 'Geopolitics - Zelensky' }, // TEMPORARY: 18→8, 3→2
  
  // Other frequently covered topics - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'israel': { minCount: 8, minSources: 2, description: 'Geopolitics - Israel' }, // TEMPORARY: 15→8, 3→2
  'palestine': { minCount: 8, minSources: 2, description: 'Geopolitics - Palestine' }, // TEMPORARY: 15→8, 3→2
  'nato': { minCount: 8, minSources: 2, description: 'Military - NATO' }, // TEMPORARY: 15→8, 3→2
  
  // Elections and political processes - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'election': { minCount: 8, minSources: 2, description: 'Politics - Elections' }, // TEMPORARY: 18→8, 3→2
  'vote': { minCount: 8, minSources: 2, description: 'Politics - Voting' }, // TEMPORARY: 15→8, 3→2
  'campaign': { minCount: 8, minSources: 2, description: 'Politics - Campaign' }, // TEMPORARY: 15→8, 3→2
  
  // Economic terms that get over-covered - TEMPORARY DEBUG: All thresholds lowered to 8/2
  'economy': { minCount: 8, minSources: 2, description: 'Economics - General' }, // TEMPORARY: 15→8, 3→2
  'economic': { minCount: 8, minSources: 2, description: 'Economics - Economic' }, // TEMPORARY: 15→8, 3→2
  'market': { minCount: 8, minSources: 2, description: 'Economics - Market' }, // TEMPORARY: 15→8, 3→2
  'inflation': { minCount: 8, minSources: 2, description: 'Economics - Inflation' }, // TEMPORARY: 15→8, 3→2

  // ===== EXPANDED GLOBAL COVERAGE (2024-2025) =====
  // TEMPORARY DEBUG: All thresholds lowered to 8/2 for testing
  
  // Ukraine War - Current conflict focus
  'ukraine war': { minCount: 8, minSources: 2, description: 'Ukraine War - Main Conflict' }, // TEMPORARY: 18→8, 3→2
  'russian offensive': { minCount: 8, minSources: 2, description: 'Ukraine War - Russian Offensive' }, // TEMPORARY: 15→8, 3→2
  'missile strike': { minCount: 8, minSources: 2, description: 'Ukraine War - Missile Strikes' }, // TEMPORARY: 15→8, 3→2
  'peace talks': { minCount: 8, minSources: 2, description: 'Ukraine War - Peace Negotiations' }, // TEMPORARY: 15→8, 3→2
  'military aid': { minCount: 8, minSources: 2, description: 'Ukraine War - Military Support' }, // TEMPORARY: 15→8, 3→2
  'donetsk': { minCount: 8, minSources: 2, description: 'Ukraine War - Donetsk Region' }, // TEMPORARY: 12→8, 3→2
  'luhansk': { minCount: 8, minSources: 2, description: 'Ukraine War - Luhansk Region' }, // TEMPORARY: 12→8, 3→2
  'crimea': { minCount: 8, minSources: 2, description: 'Ukraine War - Crimea' }, // TEMPORARY: 12→8, 3→2
  'wagner group': { minCount: 8, minSources: 2, description: 'Ukraine War - Wagner Mercenaries' }, // TEMPORARY: 12→8, 3→2
  'nuclear threat': { minCount: 8, minSources: 2, description: 'Ukraine War - Nuclear Escalation' }, // TEMPORARY: 15→8, 3→2

  // Middle East Conflicts - Current focus
  'israeli airstrike': { minCount: 8, minSources: 2, description: 'Middle East - Israeli Airstrikes' }, // TEMPORARY: 15→8, 3→2
  'gaza blockade': { minCount: 8, minSources: 2, description: 'Middle East - Gaza Blockade' }, // TEMPORARY: 15→8, 3→2
  'hostage deal': { minCount: 8, minSources: 2, description: 'Middle East - Hostage Negotiations' }, // TEMPORARY: 15→8, 3→2
  'iranian drones': { minCount: 8, minSources: 2, description: 'Middle East - Iranian Drone Technology' }, // TEMPORARY: 12→8, 3→2
  'hamas': { minCount: 8, minSources: 2, description: 'Middle East - Hamas' }, // TEMPORARY: 15→8, 3→2
  'netanyahu': { minCount: 8, minSources: 2, description: 'Middle East - Netanyahu' }, // TEMPORARY: 15→8, 3→2
  'hezbollah': { minCount: 8, minSources: 2, description: 'Middle East - Hezbollah' }, // TEMPORARY: 12→8, 3→2
  'lebanon': { minCount: 8, minSources: 2, description: 'Middle East - Lebanon' }, // TEMPORARY: 12→8, 3→2
  'syria': { minCount: 8, minSources: 2, description: 'Middle East - Syria' }, // TEMPORARY: 12→8, 3→2
  'yemen': { minCount: 8, minSources: 2, description: 'Middle East - Yemen' }, // TEMPORARY: 12→8, 3→2
  'houthi': { minCount: 8, minSources: 2, description: 'Middle East - Houthi Rebels' }, // TEMPORARY: 12→8, 3→2
  'red sea': { minCount: 8, minSources: 2, description: 'Middle East - Red Sea Shipping' }, // TEMPORARY: 12→8, 3→2

  // China & Taiwan - Current tensions
  'taiwan': { minCount: 8, minSources: 2, description: 'Asia Pacific - Taiwan' }, // TEMPORARY: 15→8, 3→2
  'beijing': { minCount: 8, minSources: 2, description: 'Asia Pacific - Beijing' }, // TEMPORARY: 15→8, 3→2
  'xi jinping': { minCount: 8, minSources: 2, description: 'Asia Pacific - Xi Jinping' }, // TEMPORARY: 15→8, 3→2
  'south china sea': { minCount: 8, minSources: 2, description: 'Asia Pacific - South China Sea' }, // TEMPORARY: 12→8, 3→2
  'taiwan strait': { minCount: 8, minSources: 2, description: 'Asia Pacific - Taiwan Strait' }, // TEMPORARY: 12→8, 3→2
  'us-china relations': { minCount: 8, minSources: 2, description: 'Asia Pacific - US-China Relations' }, // TEMPORARY: 15→8, 3→2
  'chip war': { minCount: 8, minSources: 2, description: 'Asia Pacific - Semiconductor Conflict' }, // TEMPORARY: 12→8, 3→2
  'hong kong': { minCount: 8, minSources: 2, description: 'Asia Pacific - Hong Kong' }, // TEMPORARY: 12→8, 3→2
  'xinjiang': { minCount: 8, minSources: 2, description: 'Asia Pacific - Xinjiang' }, // TEMPORARY: 12→8, 3→2
  'tibet': { minCount: 8, minSources: 2, description: 'Asia Pacific - Tibet' }, // TEMPORARY: 12→8, 3→2

  // Iran & Nuclear Issues
  'iran': { minCount: 8, minSources: 2, description: 'Middle East - Iran' }, // TEMPORARY: 15→8, 3→2
  'rouhani': { minCount: 8, minSources: 2, description: 'Middle East - Rouhani' }, // TEMPORARY: 12→8, 3→2
  'ayatollah': { minCount: 8, minSources: 2, description: 'Middle East - Ayatollah' }, // TEMPORARY: 12→8, 3→2
  'nuclear deal': { minCount: 8, minSources: 2, description: 'Middle East - Iran Nuclear Deal' }, // TEMPORARY: 15→8, 3→2
  'sanctions': { minCount: 8, minSources: 2, description: 'Global - Economic Sanctions' }, // TEMPORARY: 15→8, 3→2
  'oil embargo': { minCount: 8, minSources: 2, description: 'Global - Oil Embargo' }, // TEMPORARY: 12→8, 3→2
  'nuclear program': { minCount: 8, minSources: 2, description: 'Middle East - Iranian Nuclear Program' }, // TEMPORARY: 12→8, 3→2

  // India & South Asia
  'india': { minCount: 8, minSources: 2, description: 'South Asia - India' }, // TEMPORARY: 15→8, 3→2
  'modi': { minCount: 8, minSources: 2, description: 'South Asia - Modi' }, // TEMPORARY: 15→8, 3→2
  'parliamentary election': { minCount: 8, minSources: 2, description: 'South Asia - Indian Elections' }, // TEMPORARY: 15→8, 3→2
  'kashmir': { minCount: 8, minSources: 2, description: 'South Asia - Kashmir' }, // TEMPORARY: 12→8, 3→2
  'pakistan': { minCount: 8, minSources: 2, description: 'South Asia - Pakistan' }, // TEMPORARY: 12→8, 3→2
  'bangladesh': { minCount: 8, minSources: 2, description: 'South Asia - Bangladesh' }, // TEMPORARY: 12→8, 3→2
  'sri lanka': { minCount: 8, minSources: 2, description: 'South Asia - Sri Lanka' }, // TEMPORARY: 12→8, 3→2

  // Africa - Current conflicts
  'sudan': { minCount: 8, minSources: 2, description: 'Africa - Sudan' }, // TEMPORARY: 12→8, 3→2
  'sahel': { minCount: 8, minSources: 2, description: 'Africa - Sahel Region' }, // TEMPORARY: 12→8, 3→2
  'coup': { minCount: 8, minSources: 2, description: 'Global - Military Coups' }, // TEMPORARY: 15→8, 3→2
  'niger': { minCount: 8, minSources: 2, description: 'Africa - Niger' }, // TEMPORARY: 12→8, 3→2
  'niger junta': { minCount: 8, minSources: 2, description: 'Africa - Niger Military Junta' }, // TEMPORARY: 12→8, 3→2
  'mali': { minCount: 8, minSources: 2, description: 'Africa - Mali' }, // TEMPORARY: 12→8, 3→2
  'burkina faso': { minCount: 8, minSources: 2, description: 'Africa - Burkina Faso' }, // TEMPORARY: 12→8, 3→2
  'chad': { minCount: 8, minSources: 2, description: 'Africa - Chad' }, // TEMPORARY: 12→8, 3→2
  'ethiopia': { minCount: 8, minSources: 2, description: 'Africa - Ethiopia' }, // TEMPORARY: 12→8, 3→2
  'somalia': { minCount: 8, minSources: 2, description: 'Africa - Somalia' }, // TEMPORARY: 12→8, 3→2
  'democratic republic congo': { minCount: 8, minSources: 2, description: 'Africa - DRC' }, // TEMPORARY: 12→8, 3→2
  'rwanda': { minCount: 8, minSources: 2, description: 'Africa - Rwanda' }, // TEMPORARY: 12→8, 3→2

  // Europe & EU
  'eu': { minCount: 8, minSources: 2, description: 'Europe - European Union' }, // TEMPORARY: 15→8, 3→2
  'brussels': { minCount: 8, minSources: 2, description: 'Europe - Brussels' }, // TEMPORARY: 12→8, 3→2
  'european union': { minCount: 8, minSources: 2, description: 'Europe - European Union' }, // TEMPORARY: 15→8, 3→2
  'nato summit': { minCount: 8, minSources: 2, description: 'Europe - NATO Summit' }, // TEMPORARY: 15→8, 3→2
  'migration pact': { minCount: 8, minSources: 2, description: 'Europe - Migration Policy' }, // TEMPORARY: 12→8, 3→2
  'france': { minCount: 8, minSources: 2, description: 'Europe - France' }, // TEMPORARY: 12→8, 3→2
  'macron': { minCount: 8, minSources: 2, description: 'Europe - Macron' }, // TEMPORARY: 12→8, 3→2
  'germany': { minCount: 8, minSources: 2, description: 'Europe - Germany' }, // TEMPORARY: 12→8, 3→2
  'scholz': { minCount: 8, minSources: 2, description: 'Europe - Scholz' }, // TEMPORARY: 12→8, 3→2
  'uk': { minCount: 8, minSources: 2, description: 'Europe - United Kingdom' }, // TEMPORARY: 12→8, 3→2
  'sunak': { minCount: 8, minSources: 2, description: 'Europe - Sunak' }, // TEMPORARY: 12→8, 3→2
  'poland': { minCount: 8, minSources: 2, description: 'Europe - Poland' }, // TEMPORARY: 12→8, 3→2
  'hungary': { minCount: 8, minSources: 2, description: 'Europe - Hungary' }, // TEMPORARY: 12→8, 3→2
  'orban': { minCount: 8, minSources: 2, description: 'Europe - Orban' }, // TEMPORARY: 12→8, 3→2

  // Global Organizations
  'brics': { minCount: 8, minSources: 2, description: 'Global - BRICS Alliance' }, // TEMPORARY: 12→8, 3→2
  'brics summit': { minCount: 8, minSources: 2, description: 'Global - BRICS Summit' }, // TEMPORARY: 12→8, 3→2
  'brics expansion': { minCount: 8, minSources: 2, description: 'Global - BRICS Expansion' }, // TEMPORARY: 12→8, 3→2
  'african union': { minCount: 8, minSources: 2, description: 'Global - African Union' }, // TEMPORARY: 12→8, 3→2
  'opec': { minCount: 8, minSources: 2, description: 'Global - OPEC' }, // TEMPORARY: 12→8, 3→2
  'world bank': { minCount: 8, minSources: 2, description: 'Global - World Bank' }, // TEMPORARY: 12→8, 3→2
  'imf': { minCount: 8, minSources: 2, description: 'Global - IMF' }, // TEMPORARY: 12→8, 3→2
  'united nations': { minCount: 8, minSources: 2, description: 'Global - United Nations' }, // TEMPORARY: 12→8, 3→2
  'security council': { minCount: 8, minSources: 2, description: 'Global - UN Security Council' }, // TEMPORARY: 12→8, 3→2
  'g7': { minCount: 8, minSources: 2, description: 'Global - G7' }, // TEMPORARY: 12→8, 3→2
  'g20': { minCount: 8, minSources: 2, description: 'Global - G20' }, // TEMPORARY: 12→8, 3→2

  // Global Issues & Trends
  'migration crisis': { minCount: 8, minSources: 2, description: 'Global - Migration Crisis' }, // TEMPORARY: 15→8, 3→2
  'refugee influx': { minCount: 8, minSources: 2, description: 'Global - Refugee Crisis' }, // TEMPORARY: 12→8, 3→2
  'border clashes': { minCount: 8, minSources: 2, description: 'Global - Border Conflicts' }, // TEMPORARY: 12→8, 3→2
  'peace agreement': { minCount: 8, minSources: 2, description: 'Global - Peace Agreements' }, // TEMPORARY: 15→8, 3→2
  'ceasefire': { minCount: 8, minSources: 2, description: 'Global - Ceasefire Agreements' }, // TEMPORARY: 15→8, 3→2
  'separatist': { minCount: 8, minSources: 2, description: 'Global - Separatist Movements' }, // TEMPORARY: 12→8, 3→2
  'referendum': { minCount: 8, minSources: 2, description: 'Global - Referendums' }, // TEMPORARY: 12→8, 3→2
  'protests': { minCount: 8, minSources: 2, description: 'Global - Protests' }, // TEMPORARY: 15→8, 3→2
  'coalition': { minCount: 8, minSources: 2, description: 'Global - Political Coalitions' }, // TEMPORARY: 12→8, 3→2
  'election fraud': { minCount: 8, minSources: 2, description: 'Global - Election Fraud' }, // TEMPORARY: 12→8, 3→2
  'humanitarian crisis': { minCount: 8, minSources: 2, description: 'Global - Humanitarian Crises' }, // TEMPORARY: 12→8, 3→2
  'climate summit': { minCount: 8, minSources: 2, description: 'Global - Climate Change' }, // TEMPORARY: 12→8, 3→2
  'cyber attack': { minCount: 8, minSources: 2, description: 'Global - Cyber Warfare' }, // TEMPORARY: 12→8, 3→2
  'disinformation': { minCount: 8, minSources: 2, description: 'Global - Information Warfare' }, // TEMPORARY: 12→8, 3→2
  'artificial intelligence': { minCount: 8, minSources: 2, description: 'Global - AI Technology' }, // TEMPORARY: 12→8, 3→2
  'space race': { minCount: 8, minSources: 2, description: 'Global - Space Competition' }, // TEMPORARY: 12→8, 3→2

  // Latin America
  'brazil': { minCount: 8, minSources: 2, description: 'Latin America - Brazil' }, // TEMPORARY: 12→8, 3→2
  'lula': { minCount: 8, minSources: 2, description: 'Latin America - Lula' }, // TEMPORARY: 12→8, 3→2
  'venezuela': { minCount: 8, minSources: 2, description: 'Latin America - Venezuela' }, // TEMPORARY: 12→8, 3→2
  'maduro': { minCount: 8, minSources: 2, description: 'Latin America - Maduro' }, // TEMPORARY: 12→8, 3→2
  'colombia': { minCount: 8, minSources: 2, description: 'Latin America - Colombia' }, // TEMPORARY: 12→8, 3→2
  'mexico': { minCount: 8, minSources: 2, description: 'Latin America - Mexico' }, // TEMPORARY: 12→8, 3→2
  'amlo': { minCount: 8, minSources: 2, description: 'Latin America - AMLO' }, // TEMPORARY: 12→8, 3→2
  'argentina': { minCount: 8, minSources: 2, description: 'Latin America - Argentina' }, // TEMPORARY: 12→8, 3→2
  'milei': { minCount: 8, minSources: 2, description: 'Latin America - Milei' }, // TEMPORARY: 12→8, 3→2

  // Asia Pacific
  'japan': { minCount: 8, minSources: 2, description: 'Asia Pacific - Japan' }, // TEMPORARY: 12→8, 3→2
  'kishida': { minCount: 8, minSources: 2, description: 'Asia Pacific - Kishida' }, // TEMPORARY: 12→8, 3→2
  'south korea': { minCount: 8, minSources: 2, description: 'Asia Pacific - South Korea' }, // TEMPORARY: 12→8, 3→2
  'yoon': { minCount: 8, minSources: 2, description: 'Asia Pacific - Yoon' }, // TEMPORARY: 12→8, 3→2
  'north korea': { minCount: 8, minSources: 2, description: 'Asia Pacific - North Korea' }, // TEMPORARY: 12→8, 3→2
  'kim jong un': { minCount: 8, minSources: 2, description: 'Asia Pacific - Kim Jong Un' }, // TEMPORARY: 12→8, 3→2
  'philippines': { minCount: 8, minSources: 2, description: 'Asia Pacific - Philippines' }, // TEMPORARY: 12→8, 3→2
  'marcos': { minCount: 8, minSources: 2, description: 'Asia Pacific - Marcos' }, // TEMPORARY: 12→8, 3→2
  'vietnam': { minCount: 8, minSources: 2, description: 'Asia Pacific - Vietnam' }, // TEMPORARY: 12→8, 3→2
  'thailand': { minCount: 8, minSources: 2, description: 'Asia Pacific - Thailand' }, // TEMPORARY: 12→8, 3→2
  'myanmar': { minCount: 8, minSources: 2, description: 'Asia Pacific - Myanmar' }, // TEMPORARY: 12→8, 3→2
  'aung san suu kyi': { minCount: 8, minSources: 2, description: 'Asia Pacific - Aung San Suu Kyi' }, // TEMPORARY: 12→8, 3→2

  // Central Asia & Caucasus
  'kazakhstan': { minCount: 8, minSources: 2, description: 'Central Asia - Kazakhstan' }, // TEMPORARY: 12→8, 3→2
  'uzbekistan': { minCount: 8, minSources: 2, description: 'Central Asia - Uzbekistan' }, // TEMPORARY: 12→8, 3→2
  'kyrgyzstan': { minCount: 8, minSources: 2, description: 'Central Asia - Kyrgyzstan' }, // TEMPORARY: 12→8, 3→2
  'tajikistan': { minCount: 8, minSources: 2, description: 'Central Asia - Tajikistan' }, // TEMPORARY: 12→8, 3→2
  'turkmenistan': { minCount: 8, minSources: 2, description: 'Central Asia - Turkmenistan' }, // TEMPORARY: 12→8, 3→2
  'azerbaijan': { minCount: 8, minSources: 2, description: 'Caucasus - Azerbaijan' }, // TEMPORARY: 12→8, 3→2
  'armenia': { minCount: 8, minSources: 2, description: 'Caucasus - Armenia' }, // TEMPORARY: 12→8, 3→2
  'georgia': { minCount: 8, minSources: 2, description: 'Caucasus - Georgia' }, // TEMPORARY: 12→8, 3→2
  'nagorno karabakh': { minCount: 8, minSources: 2, description: 'Caucasus - Nagorno-Karabakh' }, // TEMPORARY: 12→8, 3→2

  // Balkans
  'serbia': { minCount: 8, minSources: 2, description: 'Balkans - Serbia' }, // TEMPORARY: 12→8, 3→2
  'kosovo': { minCount: 8, minSources: 2, description: 'Balkans - Kosovo' }, // TEMPORARY: 12→8, 3→2
  'bosnia': { minCount: 8, minSources: 2, description: 'Balkans - Bosnia' }, // TEMPORARY: 12→8, 3→2
  'croatia': { minCount: 8, minSources: 2, description: 'Balkans - Croatia' }, // TEMPORARY: 12→8, 3→2
  'montenegro': { minCount: 8, minSources: 2, description: 'Balkans - Montenegro' }, // TEMPORARY: 12→8, 3→2
  'albania': { minCount: 8, minSources: 2, description: 'Balkans - Albania' }, // TEMPORARY: 12→8, 3→2
  'north macedonia': { minCount: 8, minSources: 2, description: 'Balkans - North Macedonia' } // TEMPORARY: 12→8, 3→2
};

// Legacy hot topics (kept for backward compatibility)
const HOT_TOPICS = [
  'trump', 'russia', 'ukraine', 'biden', 'putin', 'zelensky',
  'china', 'united', 'states', 'israel', 'palestine', 'nato', 'usa'
];

// Standard thresholds for regular topics
// TEMPORARY DEBUG: Lowered thresholds for testing
const MIN_COUNT = 8; // TEMPORARY: 7→8
const HOT_TOPIC_COUNT = 8; // TEMPORARY: 24→8 (Legacy threshold for hot topics)

/**
 * Generate n-grams from a list of words
 * @param {Array} words - Array of words
 * @param {number} n - Size of n-gram (1-4)
 * @returns {Array} - Array of n-grams
 */
function generateNGrams(words, n) {
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    ngrams.push(ngram);
  }
  return ngrams;
}

/**
 * Extract and count words and phrases from articles
 * @param {Array} articles - Array of articles
 * @returns {Object} - Word and phrase count object
 */
function extractWordAndPhraseCounts(articles) {
  const counts = {};
  
  // Combine all titles and descriptions
  const text = articles
    .map(article => `${article.title} ${article.description || ''}`.toLowerCase())
    .join(' ');

  // Clean and split text into words
  const words = text
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(word => word && word.length > 2); // Filter out short words

  // Count single words (existing logic)
  words.forEach(word => {
    if (!STOP_WORDS.has(word)) {
      counts[word] = (counts[word] || 0) + 1;
    }
  });

  // Generate and count multi-word phrases (bigrams, trigrams, 4-grams)
  for (let n = 2; n <= 4; n++) {
    const ngrams = generateNGrams(words, n);
    
    ngrams.forEach(phrase => {
      // Only count phrases that don't start or end with stop words
      const phraseWords = phrase.split(' ');
      const firstWord = phraseWords[0];
      const lastWord = phraseWords[phraseWords.length - 1];
      
      // Skip phrases that start or end with stop words
      if (!STOP_WORDS.has(firstWord) && !STOP_WORDS.has(lastWord)) {
        // Additional filter: at least 50% of words in phrase should not be stop words
        const nonStopWords = phraseWords.filter(word => !STOP_WORDS.has(word));
        if (nonStopWords.length >= phraseWords.length * 0.5) {
          counts[phrase] = (counts[phrase] || 0) + 1;
        }
      }
    });
  }

  return counts;
}

/**
 * Check if a topic is a generic single word that should be avoided
 * @param {string} topic - The topic to check
 * @returns {boolean} - True if it's a generic single word
 */
function isGenericSingleWord(topic) {
  return GENERIC_SINGLE_WORDS.has(topic.toLowerCase());
}

/**
 * Get top trending keywords and phrases from articles
 * @param {Array} articles - Array of articles
 * @param {number} limit - Number of top keywords to return (default: 20)
 * @returns {Array} - Array of [keyword/phrase, count] pairs
 */
function computeTrendingKeywords(articles, limit = 20) {
  try {
    if (!articles || articles.length === 0) {
      logger.warn('No articles provided for trending analysis');
      return [];
    }

    logger.info(`Analyzing ${articles.length} articles for trending topics`);

    const counts = extractWordAndPhraseCounts(articles);
    
    // Get top keywords and phrases by count
    const topKeywords = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit * 2); // Get more candidates for filtering

    // Separate single words and multi-word phrases
    const singleWords = topKeywords.filter(([keyword]) => !keyword.includes(' '));
    const multiWordPhrases = topKeywords.filter(([keyword]) => keyword.includes(' '));

    // Prioritize multi-word phrases over generic single words
    let filtered = [];
    
    // Add multi-word phrases first (they get priority)
    filtered.push(...multiWordPhrases.slice(0, Math.floor(limit * 0.7)));
    
    // Add single words that are not generic
    const nonGenericSingleWords = singleWords.filter(([keyword]) => 
      !isGenericSingleWord(keyword) && TOPIC_KEYWORDS.has(keyword)
    );
    filtered.push(...nonGenericSingleWords.slice(0, Math.floor(limit * 0.3)));
    
    // If we don't have enough, add some generic single words as fallback
    if (filtered.length < 2) {
      const genericSingleWords = singleWords.filter(([keyword]) => 
        isGenericSingleWord(keyword) && TOPIC_KEYWORDS.has(keyword)
      );
      filtered.push(...genericSingleWords.slice(0, 2 - filtered.length));
    }

    // Sort by count and take the top limit
    filtered.sort(([, a], [, b]) => b - a);
    filtered = filtered.slice(0, limit);

    logger.logTrendingAnalysis(filtered);
    
    return filtered;
  } catch (error) {
    logger.logError('computeTrendingKeywords', error);
    return [];
  }
}

/**
 * Check if a keyword/phrase is novel (not in recent trends)
 * @param {string} keyword - The keyword/phrase to check
 * @param {Array} recentTrends - Array of recent trends
 * @returns {boolean} - True if keyword/phrase is novel
 */
function isNovel(keyword, recentTrends = []) {
  return !recentTrends.includes(keyword.toLowerCase());
}

/**
 * Select the best trending topic based on thresholds and novelty
 * Prioritizes multi-word phrases over generic single words
 * @param {Array} trends - Array of [keyword/phrase, count] pairs
 * @param {Array} recentTrends - Array of recent trends to avoid duplicates
 * @param {Array} articles - Array of articles for source diversity calculation
 * @returns {string|null} - Selected trend or null if none meet criteria
 */
function selectTrendingTopic(trends, recentTrends = [], articles = []) {
  try {
    if (!trends || trends.length === 0) {
      logger.warn('No trends provided for selection');
      return null;
    }

    logger.info(`Selecting from ${trends.length} trending topics`);

    // Sort trends to prioritize multi-word phrases
    const sortedTrends = trends.sort(([a, countA], [b, countB]) => {
      const aIsMultiWord = a.includes(' ');
      const bIsMultiWord = b.includes(' ');
      
      // Multi-word phrases get priority
      if (aIsMultiWord && !bIsMultiWord) return -1;
      if (!aIsMultiWord && bIsMultiWord) return 1;
      
      // If both are same type, sort by count
      return countB - countA;
    });

    for (const [keyword, count] of sortedTrends) {
      const kw = keyword.toLowerCase();
      
      // TEMPORARY DEBUG: Log each keyword being evaluated
      logger.info(`Evaluating keyword: "${kw}" (${count} occurrences)`);
      
      // Check if this keyword has special thresholds
      const specialThreshold = SPECIAL_TREND_THRESHOLDS[kw];
      
      if (specialThreshold) {
        // Calculate source diversity for this keyword/phrase
        const topicArticles = articles.filter(article => 
          article.title.toLowerCase().includes(kw) || 
          article.description.toLowerCase().includes(kw)
        );
        const uniqueSources = new Set(topicArticles.map(article => article.source)).size;
        
        logger.info(`  Special threshold for "${kw}": requires ${specialThreshold.minCount} articles, ${specialThreshold.minSources} sources`);
        logger.info(`  Actual: ${count} articles, ${uniqueSources} sources`);
        
        // Check if it meets the special threshold requirements
        if (count >= specialThreshold.minCount && uniqueSources >= specialThreshold.minSources && isNovel(kw, recentTrends)) {
          logger.info(`  ✅ SELECTED: "${kw}" meets all criteria`);
          logger.logTrendSelection(kw, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description,
            isMultiWord: kw.includes(' ')
          });
          return kw;
        } else {
          // Log why this high-frequency keyword was filtered out
          const reason = count < specialThreshold.minCount ? 'insufficient_articles' : 
                        uniqueSources < specialThreshold.minSources ? 'insufficient_sources' : 'not_novel';
          logger.info(`  ❌ FILTERED: "${kw}" - ${reason}`);
          logger.info(`High-frequency keyword "${kw}" filtered out:`, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description,
            reason: reason
          });
        }
      } else {
        // Use legacy threshold logic for regular topics
        const threshold = HOT_TOPICS.includes(kw) ? HOT_TOPIC_COUNT : MIN_COUNT;
        
        logger.info(`  Regular threshold for "${kw}": requires ${threshold} articles`);
        logger.info(`  Actual: ${count} articles`);

        if (count >= threshold && isNovel(kw, recentTrends)) {
          logger.info(`  ✅ SELECTED: "${kw}" meets regular criteria`);
          logger.logTrendSelection(kw, { 
            count, 
            threshold, 
            category: 'regular_topic',
            isMultiWord: kw.includes(' ')
          });
          return kw;
        } else {
          const reason = count < threshold ? 'insufficient_articles' : 'not_novel';
          logger.info(`  ❌ FILTERED: "${kw}" - ${reason}`);
        }
      }
    }

    logger.info('No trending topic met the selection criteria');
    return null;
  } catch (error) {
    logger.logError('selectTrendingTopic', error);
    return null;
  }
}

/**
 * Main function to analyze trends and select the best one
 * @param {Array} articles - Array of articles to analyze
 * @param {Array} recentTrends - Array of recent trends to avoid duplicates
 * @returns {Object|null} - Selected trend object or null
 */
function analyzeTrends(articles, recentTrends = []) {
  try {
    // TEMPORARY DEBUG: Comprehensive logging for troubleshooting
    logger.info('=== DEBUG: TRENDING ANALYSIS START ===');
    logger.info(`Articles fetched: ${articles.length}`);
    
    // Log first 10 article titles for debugging
    const first10Titles = articles.slice(0, 10).map((article, index) => 
      `${index + 1}. ${article.title}`
    );
    logger.info('First 10 article titles:');
    first10Titles.forEach(title => logger.info(`  ${title}`));
    
    // Compute trending keywords and phrases
    const trends = computeTrendingKeywords(articles);
    
    logger.info(`Unique keywords/phrases found: ${trends.length}`);
    
    // TEMPORARY DEBUG: Log all keywords with their counts
    logger.info('All keywords/phrases with counts:');
    trends.slice(0, 20).forEach(([keyword, count], index) => {
      logger.info(`  ${index + 1}. "${keyword}" (${count} occurrences)`);
    });
    
    if (trends.length === 0) {
      logger.warn('No trending keywords found - this indicates a data problem');
      return null;
    }

    // TEMPORARY DEBUG: Check for keywords close to threshold (4-7 occurrences)
    const closeToThreshold = trends.filter(([keyword, count]) => count >= 4 && count <= 7);
    if (closeToThreshold.length > 0) {
      logger.info('Keywords close to threshold (4-7 occurrences):');
      closeToThreshold.forEach(([keyword, count]) => {
        logger.info(`  "${keyword}" (${count} occurrences) - needs 8 for threshold`);
      });
    } else {
      logger.info('No keywords close to threshold (4-7 occurrences) found');
    }

    // Select the best trending topic
    const selectedTrend = selectTrendingTopic(trends, recentTrends, articles);
    
    if (selectedTrend) {
      logger.info(`=== DEBUG: TRENDING ANALYSIS COMPLETE ===`);
      logger.info(`✅ SUCCESS: Selected trend "${selectedTrend}"`);
      
      // Find the count for the selected trend
      const trendData = trends.find(([keyword]) => keyword.toLowerCase() === selectedTrend);
      const count = trendData ? trendData[1] : 0;

      return {
        keyword: selectedTrend,
        count: count,
        allTrends: trends
      };
    }

    logger.info(`=== DEBUG: TRENDING ANALYSIS COMPLETE ===`);
    logger.warn(`❌ FAILURE: No trend selected after evaluating ${trends.length} keywords/phrases`);
    logger.warn('This indicates either:');
    logger.warn('  1. All keywords below threshold (data problem)');
    logger.warn('  2. All keywords lack source diversity (data problem)');
    logger.warn('  3. All keywords already processed recently (normal)');
    return null;
  } catch (error) {
    logger.logError('analyzeTrends', error);
    return null;
  }
}

/**
 * Prepare articles for a specific trend
 * @param {Array} articles - Array of articles
 * @param {string} trend - The trending keyword/phrase
 * @returns {Object} - Prepared data with trend, articles, and image
 */
function prepareTrendData(articles, trend) {
  try {
    // Enhanced image selection logic
    let bestImageUrl = '';
    let bestImageScore = 0;
    let firstValidImage = ''; // Fallback to first valid image
    
    for (const article of articles) {
      if (!article.urlToImage || 
          typeof article.urlToImage !== 'string' || 
          !article.urlToImage.startsWith('http') || 
          article.urlToImage.includes('example.com') ||
          article.urlToImage.length <= 10) {
        continue;
      }

      // Skip images with obvious watermarks or source logos
      const lowerUrl = article.urlToImage.toLowerCase();
      const watermarkIndicators = [
        'watermark', 'logo', 'brand', 'copyright', '©', 
        'getty', 'shutterstock', 'istock', 'alamy', 'fotolia', 'depositphotos'
      ];
      
      // Only filter out obvious stock photo watermarks, not news source logos
      const hasWatermark = watermarkIndicators.some(indicator => 
        lowerUrl.includes(indicator)
      );
      
      if (hasWatermark) {
        continue;
      }

      // Score the image based on quality indicators
      let score = 0;
      
      // Prefer images with higher resolution indicators
      if (lowerUrl.includes('large') || lowerUrl.includes('high') || lowerUrl.includes('hd')) {
        score += 3;
      }
      if (lowerUrl.includes('medium')) {
        score += 2;
      }
      if (lowerUrl.includes('small') || lowerUrl.includes('thumb')) {
        score += 1;
      }
      
      // Prefer images from trusted image hosting services
      const trustedHosts = ['imgur.com', 'flickr.com', 'unsplash.com', 'pexels.com'];
      const isTrustedHost = trustedHosts.some(host => lowerUrl.includes(host));
      if (isTrustedHost) {
        score += 2;
      }
      
      // Avoid images with obvious text or overlay indicators (but don't penalize too much)
      const textIndicators = ['text', 'overlay', 'caption', 'label'];
      const hasText = textIndicators.some(indicator => lowerUrl.includes(indicator));
      if (hasText) {
        score -= 0.5; // Reduced penalty
      }
      
      // Track first valid image as fallback
      if (!firstValidImage) {
        firstValidImage = article.urlToImage;
      }
      
      // Select the image with the highest score
      if (score > bestImageScore) {
        bestImageScore = score;
        bestImageUrl = article.urlToImage;
      }
    }

    // Use best scored image, or fallback to first valid image
    const selectedImage = bestImageUrl || firstValidImage;
    
    // Enhanced logging for image selection
    logger.info('Image selection completed:', {
      trend,
      total_articles: articles.length,
      articles_with_images: articles.filter(a => a.urlToImage).length,
      selected_image: selectedImage,
      selection_method: bestImageUrl ? 'scored' : firstValidImage ? 'first_valid' : 'none',
      best_score: bestImageScore,
      rejected_images: articles.filter(a => a.urlToImage && !a.urlToImage.includes('example.com') && a.urlToImage.length > 10).length - (selectedImage ? 1 : 0)
    });
    
    return {
      trend,
      articles,
      image_url: selectedImage
    };
  } catch (error) {
    logger.logError('prepareTrendData', error);
    return {
      trend,
      articles: [],
      image_url: ''
    };
  }
}

module.exports = {
  analyzeTrends,
  computeTrendingKeywords,
  selectTrendingTopic,
  prepareTrendData,
  TOPIC_KEYWORDS,
  HOT_TOPICS,
  MIN_COUNT,
  HOT_TOPIC_COUNT,
  SPECIAL_TREND_THRESHOLDS,
  GENERIC_SINGLE_WORDS
}; 