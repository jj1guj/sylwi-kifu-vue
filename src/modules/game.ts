export type GameListEntry = {
  gameId: string;
  gameName: string;
};

export const formatFloodgateGameName = (gameId: string): string => {
  const gameIdParts = gameId.split("+");
  const startedAt = gameIdParts[4];
  if (gameIdParts.length !== 5 || !/^\d{14}$/.test(startedAt)) {
    return gameId;
  }

  return `☗${gameIdParts[2]} ☖${gameIdParts[3]} (${startedAt.substring(
    0,
    4
  )}-${startedAt.substring(4, 6)}-${startedAt.substring(
    6,
    8
  )} ${startedAt.substring(8, 10)}:${startedAt.substring(
    10,
    12
  )}:${startedAt.substring(12, 14)})`;
};

export const includesPlayerName = (
  game: GameListEntry,
  query: string
): boolean => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const gameIdParts = game.gameId.split("+");
  return gameIdParts
    .slice(2, 4)
    .some((playerName) =>
      playerName.toLocaleLowerCase().includes(normalizedQuery)
    );
};
