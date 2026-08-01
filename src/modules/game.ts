export type GameListEntry = {
  gameId: string;
  gameName: string;
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