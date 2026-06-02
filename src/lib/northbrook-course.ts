// Course data: Northbrook Golf & Grill, Luxemburg, WI
// 9-hole course. Blue tees: Par 36, 3256 yards, Rating 70.1, Slope 126

export const NORTHBROOK_GOLF_GRILL = {
  name: 'Northbrook Golf & Grill',
  city: 'Luxemburg',
  state: 'WI',
  par: 36,
  nine_hole_only: true,
  hole_pars: [4, 5, 4, 3, 4, 4, 4, 3, 5],
  hole_handicaps_men: [17, 5, 15, 13, 3, 9, 1, 11, 7],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [359, 470, 366, 184, 376, 364, 400, 180, 557],
      total: 3256,
      rating: 70.1,
      slope: 126,
    },
  },
  front9par: 36,
}
