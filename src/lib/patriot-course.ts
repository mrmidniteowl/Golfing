// Default course data: The Patriot Golf Club, Abrams, WI
// Source: https://course.bluegolf.com/bluegolf/course/course/patriotgcwisco/detailedscorecard.htm

export const PATRIOT_GOLF_CLUB = {
  name: 'The Patriot Golf Club',
  city: 'Abrams',
  state: 'WI',
  par: 72,
  hole_pars: [4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 4, 5, 5, 4, 4, 4],
  hole_handicaps_men: [13, 11, 3, 9, 5, 1, 17, 7, 15, 18, 10, 6, 8, 16, 2, 12, 14, 4],
  hole_handicaps_women: [13, 11, 3, 9, 5, 1, 17, 7, 15, 18, 10, 6, 8, 16, 2, 12, 14, 4],
  tees: {
    white_men: {
      label: 'White (M)',
      yardages: [386, 144, 361, 316, 394, 437, 123, 461, 342, 301, 330, 183, 371, 474, 503, 332, 355, 339],
      total: 6152,
      rating: 70.2,
      slope: 123,
    },
    gold_men: {
      label: 'Gold (M)',
      yardages: [358, 129, 294, 285, 356, 386, 110, 427, 327, 286, 317, 98, 327, 432, 450, 316, 337, 252],
      total: 5487,
      rating: 67.3,
      slope: 116,
    },
    white_women: {
      label: 'White (L)',
      yardages: [386, 144, 361, 316, 394, 437, 123, 461, 342, 301, 330, 183, 371, 474, 503, 332, 355, 339],
      total: 6152,
      rating: 75.4,
      slope: 134,
    },
    red_women: {
      label: 'Red (L)',
      yardages: [358, 129, 294, 285, 356, 386, 110, 427, 327, 286, 317, 98, 327, 432, 450, 316, 337, 252],
      total: 5487,
      rating: 71.7,
      slope: 126,
    },
  },
  front9par: 35,
  back9par: 37,
}
