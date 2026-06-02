// Course data: Irish Waters Golf Club, Freedom, WI
// White tees: Par 71, 5772 yards, Rating 67.8, Slope 114

export const IRISH_WATERS_GOLF_CLUB = {
  name: 'Irish Waters Golf Club',
  city: 'Freedom',
  state: 'WI',
  par: 71,
  hole_pars: [4, 4, 5, 3, 4, 4, 4, 3, 4, 4, 4, 3, 5, 3, 4, 4, 4, 5],
  hole_handicaps: [13, 1, 3, 17, 5, 9, 11, 15, 7, 6, 10, 16, 2, 18, 12, 14, 8, 4],
  tees: {
    white: {
      label: 'White',
      yardages: [305, 372, 482, 124, 395, 365, 303, 196, 358, 390, 310, 136, 506, 118, 272, 279, 370, 491],
      total: 5772,
      rating: 67.8,
      slope: 114,
    },
  },
  front9par: 35,
  back9par: 36,
}
