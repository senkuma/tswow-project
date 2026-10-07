"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.growthTable = growthTable;
function growthTable(anchors) {
    validateAnchors(anchors);
    const bonuses = Object.keys(anchors[0].bonuses);
    const levels = [];
    for(let index = 1; index < anchors.length; index++){
        const from = anchors[index - 1];
        const to = anchors[index];
        // Each segment ends where the next begins; the final anchor is added once, below.
        for(let level = from.level; level < to.level; level++){
            const progress = (level - from.level) / (to.level - from.level);
            levels.push(bonuses.map((bonus)=>Math.round(interpolate(from.bonuses[bonus], to.bonuses[bonus], progress))
            ));
        }
    }
    const last = anchors[anchors.length - 1];
    levels.push(bonuses.map((bonus)=>last.bonuses[bonus]
    ));
    return {
        bonuses,
        levels
    };
}
function interpolate(from, to, progress) {
    return from * Math.pow(to / from, progress);
}
function validateAnchors(anchors) {
    if (anchors.length < 2 || anchors[0].level !== 1) {
        throw new Error('A growing weapon needs at least two growth anchors, the first at level 1.');
    }
    const bonuses = Object.keys(anchors[0].bonuses).sort();
    if (bonuses.length === 0) {
        throw new Error('A growing weapon needs at least one bonus.');
    }
    anchors.forEach((anchor, index)=>{
        if (index > 0 && anchor.level <= anchors[index - 1].level) {
            throw new Error(`Growth anchors must be in increasing level order (level ${anchor.level}).`);
        }
        if (Object.keys(anchor.bonuses).sort().join() !== bonuses.join()) {
            throw new Error(`The growth anchor at level ${anchor.level} must give exactly: ${bonuses.join(', ')}.`);
        }
        Object.values(anchor.bonuses).forEach((amount)=>{
            if (!(amount > 0)) {
                throw new Error(`Growth bonuses must be positive (level ${anchor.level}).`);
            }
        });
    });
}

//# sourceMappingURL=GrowthCurve.js.map