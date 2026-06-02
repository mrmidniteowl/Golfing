// Course data: Mid Valle Golf Course - White (White Nine), De Pere, WI
// White tees: Par 35, 3047 yards

export const MID_VALLE_WHITE = {
  name: 'Mid Valle Golf Course - White',
  city: 'De Pere',
  state: 'WI',
  par: 35,
  nine_hole_only: true,
  hole_pars: [4, 5, 4, 4, 3, 4, 4, 3, 4],
  tees: {
    championship: {
      label: 'Championship',
      yardages: [338, 579, 375, 353, 198, 435, 355, 173, 416],
      total: 3222,
    },
    white: {
      label: 'White',
      yardages: [330, 559, 358, 339, 170, 421, 300, 165, 405],
      total: 3047,
    },
    gold: {
      label: 'Gold',
      yardages: [328, 484, 338, 311, 135, 370, 295, 160, 316],
      total: 2737,
    },
  },
  front9par: 35,
}
