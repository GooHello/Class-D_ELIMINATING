export interface GameSave {
  currentLevel: number;
  totalConsumed: number;
  hesitationCount: number;
  hesitationHistory: { level: number; timestamp: number }[];
  firstIgnoredProfessionLevel: number | null;
  unlockedAchievements: string[];
  readEmails: string[];
  ethicsReviewsPassed: number;
  inventoryCount: number;
  kpiHistory: { level: number; consumed: number; rating: string }[];
  endingASeen: boolean;
  endingBSeen: boolean;
  playerOperatorId: string;
  playStartTime: number;
  levelsWithoutHesitation: number;
  levelStartTime: number;
  dailyConsumed: number;
  weeklyConsumed: number;
  // Level state persistence
  boardState: string | null; // JSON stringified board
  progressState: string | null;
  movesLeftState: number | null;
  levelConsumedState: number;
  // Skills
  skillShuffleUsed: number;
  skillPurgeUsed: number;
  skillExtraMovesUsed: number;
  // 人性指数 (隐藏)
  humanityScore: number;
  // 库存补充次数 (影响补充量)
  purchaseCount: number;
  // 周目计数
  cycleCount: number;
  // 上一周目结局ID
  lastEndingId: string;
}

const SAVE_KEY = 'dclass_match3_save';

export const defaultSave: GameSave = {
  currentLevel: 1,
  totalConsumed: 0,
  hesitationCount: 0,
  hesitationHistory: [],
  firstIgnoredProfessionLevel: null,
  unlockedAchievements: [],
  readEmails: [],
  ethicsReviewsPassed: 0,
  inventoryCount: 3000,
  kpiHistory: [],
  endingASeen: false,
  endingBSeen: false,
  playerOperatorId: `D-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  playStartTime: Date.now(),
  levelsWithoutHesitation: 0,
  levelStartTime: Date.now(),
  dailyConsumed: 0,
  weeklyConsumed: 0,
  boardState: null,
  progressState: null,
  movesLeftState: null,
  levelConsumedState: 0,
  skillShuffleUsed: 0,
  skillPurgeUsed: 0,
  skillExtraMovesUsed: 0,
  humanityScore: 60,
  purchaseCount: 0,
  cycleCount: 0,
  lastEndingId: '',
};

export function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSave, ...parsed };
    }
  } catch {
    // corrupted save
  }
  return { ...defaultSave };
}

export function saveSave(data: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function resetSave(): GameSave {
  const fresh = { ...defaultSave, playStartTime: Date.now(), playerOperatorId: `D-${String(Math.floor(Math.random() * 9000) + 1000)}` };
  saveSave(fresh);
  return fresh;
}