// Course data: Crystal Springs Golf Club, Seymour, WI
// White tees: Par 72, 6163 yards, Rating 69.2, Slope 120

export const CRYSTAL_SPRINGS_GOLF_CLUB = {
  name: 'Crystal Springs Golf Club',
  city: 'Seymour',
  state: 'WI',
  par: 72,
  hole_pars: [5, 4, 4, 4, 3, 4, 4, 3, 5, 5, 3, 4, 4, 4, 4, 4, 3, 5],
  hole_handicaps_men: [3, 7, 11, 9, 17, 5, 13, 15, 1, 4, 18, 10, 8, 12, 6, 14, 16, 2],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [544, 412, 364, 383, 166, 429, 334, 217, 525, 581, 170, 301, 351, 314, 402, 314, 171, 552],
      total: 6530,
      rating: 70.9,
      slope: 124,
    },
    white: {
      label: 'White',
      yardages: [527, 406, 350, 366, 133, 406, 323, 184, 471, 566, 159, 276, 334, 296, 384, 292, 150, 540],
      total: 6163,
      rating: 69.2,
      slope: 120,
    },
    gold: {
      label: 'Gold',
      yardages: [441, 398, 339, 375, 122, 348, 319, 176, 467, 488, 154, 265, 305, 284, 370, 275, 132, 422],
      total: 5680,
      rating: 68.7,
      slope: 119,
    },
  },
  front9par: 36,
  back9par: 36,
}
