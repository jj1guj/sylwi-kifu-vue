export const getKifuMirrorUrl = (
  _tournament: string,
  gameid: string
): string => {
  return `https://wdoor.c.u-tokyo.ac.jp/shogi/x/${gameid.substring(
    gameid.length - 14,
    gameid.length - 10
  )}/${gameid.substring(
    gameid.length - 10,
    gameid.length - 8
  )}/${gameid.substring(gameid.length - 8, gameid.length - 6)}/${gameid}.csa`;
};

export const getKifuOrgUrl = (tournament: string, gameid: string): string => {
  void tournament;
  return getKifuMirrorUrl("floodgate", gameid);
};

export const fetchGameListMirrorUrl = (tournament: string): string => {
  void tournament;
  return "https://wdoor.c.u-tokyo.ac.jp/shogi/x/shogi-server.log";
};

export const fetchGameListOrgUrl = (tournament: string): string => {
  void tournament;
  return "https://wdoor.c.u-tokyo.ac.jp/shogi/x/shogi-server.log";
};
