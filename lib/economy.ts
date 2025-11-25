export function miningRate(level: number): number {
  return 8 + Math.floor(level * 1.5);
}

export function upgradeCost(level: number): number {
  // Formula lebih sulit: 50 + floor(level^2 * 5) + (level * 50)
  return 50 + Math.floor(Math.pow(level, 2) * 5) + (level * 50);
}

export function nextUpgradeCost(currentLevel: number): number {
  if (currentLevel >= 10) return Infinity; // Max level
  return upgradeCost(currentLevel);
}

export function staySplit() {
  return {
    guestShare: 0.8,
    hostShare: 0.2
  };
}
