export const useEloRating = () => {
  const calculateEloRating = (winnerRating: number, loserRating: number, kFactor: number = 32) => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
    
    const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWinner));
    const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoser));
    
    const ratingChange = newWinnerRating - winnerRating;
    
    return {
      newWinnerRating,
      newLoserRating,
      ratingChange
    };
  };

  return { calculateEloRating };
};