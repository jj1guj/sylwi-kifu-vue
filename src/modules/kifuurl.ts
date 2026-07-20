export const getKifuMirrorUrl = (
  _tournament: string,
  gameid: string
): string => {
  const path = `${gameid.substring(
    gameid.length - 14,
    gameid.length - 10
  )}/${gameid.substring(
    gameid.length - 10,
    gameid.length - 8
  )}/${gameid.substring(gameid.length - 8, gameid.length - 6)}/${gameid}.csa`;
  return `/api/floodgate?path=${encodeURIComponent(path)}`;
};

export const getKifuOrgUrl = (tournament: string, gameid: string): string => {
  void tournament;
  return getKifuMirrorUrl("floodgate", gameid);
};

export const fetchGameListMirrorUrl = (tournament: string): string => {
  void tournament;
  return "/api/floodgate?path=shogi-server.log";
};

export const fetchGameListOrgUrl = (tournament: string): string => {
  void tournament;
  return "/api/floodgate?path=shogi-server.log";
};
