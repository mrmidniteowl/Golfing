// Course data: Mid Valle Golf Course - Blue (Blue Nine), De Pere, WI
// White tees: Par 35, 2963 yards

export const MID_VALLE_BLUE = {
  name: 'Mid Valle Golf Course - Blue',
  city: 'De Pere',
  state: 'WI',
  par: 35,
  nine_hole_only: true,
  hole_pars: [4, 3, 4, 4, 4, 3, 5, 3, 5],
  tees: {
    championship: {
      label: 'Championship',
      yardages: [423, 172, 409, 412, 404, 186, 524, 163, 507],
      total: 3200,
    },
    white: {
      label: 'White',
      yardages: [412, 145, 364, 377, 374, 160, 516, 119, 466],
      total: 2963,
    },
    gold: {
      label: 'Gold',
      yardages: [380, 135, 350, 350, 348, 154, 442, 113, 461],
      total: 2733,
    },
  },
  front9par: 35,
}
