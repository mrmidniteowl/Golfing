// Course data: Royal St. Patrick's Golf Links, Wrightstown, WI
// Black tees: Par 72, 7071 yards, Rating 74.0, Slope 137

export const ROYAL_ST_PATRICKS_GOLF_LINKS = {
  name: "Royal St. Patrick's Golf Links",
  city: 'Wrightstown',
  state: 'WI',
  par: 72,
  nine_hole_only: false,
  hole_pars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 3, 4, 5, 3, 4, 5, 4],
  hole_handicaps_men: [11, 5, 3, 17, 7, 9, 1, 15, 13, 6, 10, 18, 14, 2, 16, 8, 4, 12],
  tees: {
    black: {
      label: 'Black',
      yardages: [405, 406, 544, 182, 409, 403, 600, 179, 417, 390, 377, 159, 393, 560, 220, 439, 536, 452],
      total: 7071,
      rating: 74.0,
      slope: 137,
    },
  },
  front9par: 36,
  back9par: 36,
}
