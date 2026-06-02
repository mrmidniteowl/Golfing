// Course data: Royal Scot Golf Club, New Franken, WI
// White tees: Par 72, 6192 yards, Rating 69.2, Slope 120

export const ROYAL_SCOT_GOLF_CLUB = {
  name: 'Royal Scot Golf Club',
  city: 'New Franken',
  state: 'WI',
  par: 72,
  hole_pars: [4, 3, 5, 4, 4, 3, 4, 4, 5, 4, 4, 3, 5, 4, 3, 5, 4, 4],
  hole_handicaps_men: [9, 15, 5, 7, 3, 17, 11, 13, 1, 12, 10, 14, 2, 8, 16, 4, 18, 6],
  tees: {
    black: {
      label: 'Black',
      yardages: [401, 207, 546, 401, 429, 179, 373, 359, 561, 395, 401, 190, 513, 395, 178, 523, 350, 401],
      total: 6802,
      rating: 72.2,
      slope: 126,
    },
    blue: {
      label: 'Blue',
      yardages: [385, 193, 517, 386, 401, 166, 363, 348, 543, 380, 375, 175, 496, 357, 168, 510, 343, 382],
      total: 6488,
      rating: 70.9,
      slope: 124,
    },
    white: {
      label: 'White',
      yardages: [372, 155, 492, 373, 378, 155, 354, 335, 528, 361, 364, 163, 481, 336, 142, 498, 336, 369],
      total: 6192,
      rating: 69.2,
      slope: 120,
    },
    gold: {
      label: 'Gold',
      yardages: [304, 141, 438, 332, 302, 132, 320, 323, 435, 349, 315, 151, 413, 281, 140, 453, 297, 301],
      total: 5427,
      rating: 65.8,
      slope: 106,
    },
  },
  front9par: 36,
  back9par: 36,
}
