// Course data: Oneida Golf Club, Green Bay, WI
// Back tees: Par 72, 6686 yards, Rating 72.4, Slope 134

export const ONEIDA_GOLF_CLUB = {
  name: 'Oneida Golf Club',
  city: 'Green Bay',
  state: 'WI',
  par: 72,
  nine_hole_only: false,
  hole_pars: [4, 5, 3, 4, 4, 4, 4, 3, 5, 4, 3, 5, 3, 5, 4, 4, 3, 5],
  hole_handicaps_men: [9, 3, 17, 13, 7, 1, 5, 15, 11, 6, 14, 4, 16, 2, 10, 12, 18, 8],
  tees: {
    back: {
      label: 'Back',
      yardages: [440, 548, 193, 407, 411, 393, 346, 173, 524, 409, 147, 486, 167, 544, 372, 379, 215, 532],
      total: 6686,
      rating: 72.4,
      slope: 134,
    },
  },
  front9par: 36,
  back9par: 36,
}
