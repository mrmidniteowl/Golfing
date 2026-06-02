// Course data: Thornberry Creek Golf Club, Oneida, WI
// White tees: Par 72, 6376 yards, Rating 71.0, Slope 125

export const THORNBERRY_CREEK_GOLF_CLUB = {
  name: 'Thornberry Creek Golf Club',
  city: 'Oneida',
  state: 'WI',
  par: 72,
  nine_hole_only: false,
  hole_pars: [4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 5, 4, 3, 4],
  hole_handicaps_men: [1, 17, 11, 7, 5, 13, 9, 15, 3, 16, 8, 18, 14, 4, 10, 12, 6, 2],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [428, 169, 497, 397, 420, 361, 383, 190, 518, 397, 440, 190, 525, 457, 550, 385, 218, 409],
      total: 6934,
      rating: 73.4,
      slope: 134,
    },
    white: {
      label: 'White',
      yardages: [400, 146, 480, 358, 368, 331, 347, 170, 490, 355, 415, 160, 492, 412, 505, 367, 196, 384],
      total: 6376,
      rating: 71.0,
      slope: 125,
    },
    gold: {
      label: 'Gold',
      yardages: [352, 118, 459, 330, 279, 296, 313, 133, 450, 322, 370, 130, 458, 367, 463, 348, 167, 370],
      total: 5725,
      rating: 68.1,
      slope: 119,
    },
  },
  front9par: 36,
  back9par: 36,
}
