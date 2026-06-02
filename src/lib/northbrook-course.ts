// Course data: Northbrook Golf & Grill, Luxemburg, WI
// Blue tees: Par 71, 6280 yards, Rating 70.1, Slope 126

export const NORTHBROOK_GOLF_GRILL = {
  name: 'Northbrook Golf & Grill',
  city: 'Luxemburg',
  state: 'WI',
  par: 71,
  nine_hole_only: false,
  hole_pars: [4, 5, 4, 3, 4, 4, 4, 3, 5, 4, 3, 4, 3, 4, 4, 5, 4, 4],
  hole_handicaps_men: [17, 5, 15, 13, 3, 9, 1, 11, 7, 2, 16, 12, 18, 8, 14, 6, 10, 4],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [359, 470, 366, 184, 376, 364, 400, 180, 557, 424, 160, 351, 122, 346, 339, 514, 337, 431],
      total: 6280,
      rating: 70.1,
      slope: 126,
    },
  },
  front9par: 36,
  back9par: 35,
}
