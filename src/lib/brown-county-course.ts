// Course data: Brown County Golf Course, Oneida, WI
// Blue tees: Par 72, 6804 yards, Rating 72.7, Slope 130

export const BROWN_COUNTY_GOLF_COURSE = {
  name: 'Brown County Golf Course',
  city: 'Oneida',
  state: 'WI',
  par: 72,
  nine_hole_only: false,
  hole_pars: [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 4, 4, 5, 3, 4, 3, 4],
  hole_handicaps_men: [15, 7, 17, 1, 11, 5, 13, 9, 3, 6, 2, 8, 10, 12, 18, 14, 16, 4],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [385, 498, 160, 423, 366, 524, 188, 393, 446, 520, 447, 399, 349, 555, 153, 420, 177, 401],
      total: 6804,
      rating: 72.7,
      slope: 130,
    },
  },
  front9par: 36,
  back9par: 36,
}
