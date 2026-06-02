// Course data: Mid Valle Golf Course - Red (Red Nine), WI
// White tees: Par 35, 2832 yards

export const MID_VALLE_RED = {
  name: 'Mid Valle Golf Course - Red',
  city: null,
  state: 'WI',
  par: 35,
  nine_hole_only: true,
  hole_pars: [3, 5, 3, 4, 4, 5, 4, 3, 4],
  tees: {
    championship: {
      label: 'Championship',
      yardages: [116, 501, 185, 377, 387, 562, 408, 110, 388],
      total: 3034,
    },
    white: {
      label: 'White',
      yardages: [97, 481, 160, 370, 376, 546, 361, 101, 340],
      total: 2832,
    },
    gold: {
      label: 'Gold',
      yardages: [92, 461, 140, 365, 371, 476, 315, 97, 336],
      total: 2653,
    },
  },
  front9par: 35,
}
