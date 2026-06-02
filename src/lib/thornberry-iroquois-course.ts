// Course data: Thornberry Creek Golf Club - Iroquois (White Nine), Oneida, WI
// White tees: Par 36, 2766 yards

export const THORNBERRY_CREEK_IROQUOIS = {
  name: 'Thornberry Creek Golf Club - Iroquois',
  city: 'Oneida',
  state: 'WI',
  par: 36,
  nine_hole_only: true,
  hole_pars: [4, 5, 4, 3, 5, 3, 4, 5, 3],
  tees: {
    blue: {
      label: 'Blue',
      yardages: [312, 468, 363, 158, 471, 132, 355, 537, 156],
      total: 2952,
    },
    white: {
      label: 'White',
      yardages: [288, 439, 343, 146, 444, 123, 324, 518, 141],
      total: 2766,
    },
    gold: {
      label: 'Gold',
      yardages: [270, 412, 293, 118, 409, 100, 301, 478, 119],
      total: 2500,
    },
  },
  front9par: 36,
}
