/* Coordinate corrections for restored high-resolution kit artwork. */
(function () {
  'use strict';

  const profiles = window.S9KitProfiles;
  if (!profiles) return;

  const restoredPanels = {
    'assets/kits/national/home/austria_1990.png': [288, 198, 192, 208],
    'assets/kits/national/home/costarica_1990.png': [288, 198, 192, 208],
    'assets/kits/national/away/poland_2002.png': [288, 198, 192, 208],
    'assets/kits/national/away/greece_2004.png': [288, 198, 192, 208],
    'assets/kits/national/away/scotland_1998.png': [288, 198, 192, 208],
    'assets/kits/national/away/russia_2008.png': [288, 198, 192, 208],
    'assets/kits/national/away/saudi_1994.png': [288, 198, 192, 208],
    'assets/kits/national/away/costarica_1990.png': [288, 198, 192, 208],
    'assets/kits/national/away/australia_2006.png': [288, 198, 192, 208],
    'assets/kits/national/away/england_1996.png': [288, 198, 192, 208],
    'assets/kits/national/away/ivory_2006.png': [288, 198, 192, 208],
    'assets/kits/national/home/colombia_1994.png': [288, 198, 192, 208],
    'assets/kits/national/home/greece_2004.png': [288, 198, 192, 208],
    'assets/kits/national/home/morocco_1998.png': [288, 198, 192, 208],
    'assets/kits/national/home/poland_2002.png': [288, 198, 192, 208],
    'assets/kits/national/home/scotland_1998.png': [288, 198, 192, 208],
    'assets/kits/national/home/switzerland_2006.png': [288, 198, 192, 208],
    'assets/kits/national/away/austria_1990.png': [288, 198, 192, 208],
    'assets/kits/national/away/chile_1998.png': [288, 198, 192, 208],
    'assets/kits/national/away/colombia_1994.png': [288, 198, 192, 208],
    'assets/kits/national/away/morocco_1998.png': [288, 198, 192, 208],
    'assets/kits/national/away/switzerland_2006.png': [288, 198, 192, 208],
    'assets/kits/italian/away/chievo_0102.png': [157.5, 106, 105, 121],
    'assets/kits/italian/away/reggina_0203.png': [157.5, 106, 105, 121]
  };

  Object.entries(restoredPanels).forEach(([src, panel]) => {
    if (profiles[src]) profiles[src].panel = panel;
  });
})();
