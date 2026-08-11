// Auto-generated shape table for the sprite render benchmark.
// Wraps the exported sprite blobs (PlayerSprites.h / smallsprites.h) with
// display names and lengths so main.c can browse them.  Regenerate with the
// python snippet in the project notes if the .h exports change.

#include "shapes.h"
#include "PlayerSprites.h"
#include "smallsprites.h"

static const Shape playerShapes[] = {
    { "CRUISER1\x80", cruiser1, sizeof(cruiser1) },
    { "CRUISER2\x80", cruiser2, sizeof(cruiser2) },
    { "CRUISER3\x80", cruiser3, sizeof(cruiser3) },
    { "SNOWBALL1\x80", snowball1, sizeof(snowball1) },
    { "SNOWBALL2\x80", snowball2, sizeof(snowball2) },
    { "SNOWBALL3\x80", snowball3, sizeof(snowball3) },
    { "LADYBUG1\x80", ladybug1, sizeof(ladybug1) },
    { "LADYBUG2\x80", ladybug2, sizeof(ladybug2) },
    { "LADYBUG3\x80", ladybug3, sizeof(ladybug3) },
    { "GNAT1\x80", gnat1, sizeof(gnat1) },
    { "GNAT2\x80", gnat2, sizeof(gnat2) },
    { "GNAT3\x80", gnat3, sizeof(gnat3) },
    { "SELENA1\x80", selena1, sizeof(selena1) },
    { "SELENA2\x80", selena2, sizeof(selena2) },
    { "SELENA3\x80", selena3, sizeof(selena3) },
    { "SHIELD1\x80", shield1, sizeof(shield1) },
    { "SHIELD2\x80", shield2, sizeof(shield2) },
    { "SHIELD3\x80", shield3, sizeof(shield3) },
};

static const Shape smallShapes[] = {
    { "SAUCER\x80", saucer, sizeof(saucer) },
    { "JET1\x80", jet1, sizeof(jet1) },
    { "JET2\x80", jet2, sizeof(jet2) },
    { "JET3\x80", jet3, sizeof(jet3) },
    { "MINE\x80", mine, sizeof(mine) },
    { "COPTER1\x80", copter1, sizeof(copter1) },
    { "COPTER2\x80", copter2, sizeof(copter2) },
    { "COPTER3\x80", copter3, sizeof(copter3) },
    { "COPTER4\x80", copter4, sizeof(copter4) },
    { "COPTER5\x80", copter5, sizeof(copter5) },
    { "COPTER6\x80", copter6, sizeof(copter6) },
    { "COPTER7\x80", copter7, sizeof(copter7) },
    { "COPTER8\x80", copter8, sizeof(copter8) },
    { "SWIRL1\x80", swirl1, sizeof(swirl1) },
    { "SWIRL2\x80", swirl2, sizeof(swirl2) },
    { "SWIRL3\x80", swirl3, sizeof(swirl3) },
    { "SWIRL4\x80", swirl4, sizeof(swirl4) },
    { "BOMB\x80", bomb, sizeof(bomb) },
    { "EXPLOD1\x80", explod1, sizeof(explod1) },
    { "EXPLOD2\x80", explod2, sizeof(explod2) },
    { "EXPLOD3\x80", explod3, sizeof(explod3) },
    { "EXPLOD4\x80", explod4, sizeof(explod4) },
    { "EXPLOD5\x80", explod5, sizeof(explod5) },
    { "EXPLOD6\x80", explod6, sizeof(explod6) },
    { "BENGINE1\x80", bengine1, sizeof(bengine1) },
    { "BENGINE2\x80", bengine2, sizeof(bengine2) },
    { "BULLET\x80", bullet, sizeof(bullet) },
    { "PULSE1\x80", pulse1, sizeof(pulse1) },
    { "PULSE2\x80", pulse2, sizeof(pulse2) },
    { "PULSE3\x80", pulse3, sizeof(pulse3) },
    { "FLAME1\x80", flame1, sizeof(flame1) },
    { "FLAME2\x80", flame2, sizeof(flame2) },
    { "WAVELEFT\x80", waveleft, sizeof(waveleft) },
    { "WAVERIGHT\x80", waveright, sizeof(waveright) },
    { "SHOTSTRAIGHT\x80", shotstraight, sizeof(shotstraight) },
    { "SHOT1LEFT\x80", shot1left, sizeof(shot1left) },
    { "SHOT1RIGHT\x80", shot1right, sizeof(shot1right) },
    { "SHOT2LEFT\x80", shot2left, sizeof(shot2left) },
    { "SHOT2RIGHT\x80", shot2right, sizeof(shot2right) },
    { "HOMING\x80", homing, sizeof(homing) },
    { "BEAMGENLEFT\x80", beamgenleft, sizeof(beamgenleft) },
    { "BEAMGENRIGHT\x80", beamgenright, sizeof(beamgenright) },
};

const ShapeSet shapeSets[NUM_SETS] = {
    { "PLAYER\x80", playerShapes, sizeof(playerShapes)/sizeof(playerShapes[0]) },
    { "SMALL\x80",  smallShapes,  sizeof(smallShapes)/sizeof(smallShapes[0])  },
};
