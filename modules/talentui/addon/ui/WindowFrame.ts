import { ATLAS, AtlasPiece, PARTS_TEXTURE } from "./TalentArt";

/** A texture showing one atlas piece at its display size. */
export function createAtlasTexture(frame: WoWAPI.Frame, piece: AtlasPiece, layer: WoWAPI.Layer) {
    const texture = frame.CreateTexture(undefined, layer);
    texture.SetTexture(PARTS_TEXTURE);
    setAtlasPiece(texture, piece);
    texture.SetSize(piece.width, piece.height);
    return texture;
}

/** Points an existing texture at another atlas piece, keeping its size. */
export function setAtlasPiece(texture: WoWAPI.Texture, piece: AtlasPiece) {
    texture.SetTexCoord(piece.left, piece.right, piece.top, piece.bottom);
}

type Corner = 'TOPLEFT' | 'TOPRIGHT' | 'BOTTOMLEFT' | 'BOTTOMRIGHT';

/** Places a piece in a corner, reaching past the frame's edges by its outsets. */
function placeCorner(frame: WoWAPI.Frame, piece: AtlasPiece, corner: Corner) {
    const texture = createAtlasTexture(frame, piece, 'OVERLAY');
    const x = corner.endsWith('LEFT') ? -piece.outsetX : piece.outsetX;
    const y = corner.startsWith('TOP') ? piece.outsetY : -piece.outsetY;
    texture.SetPoint(corner, x, y);
}

/**
 * The stone title bar between the top corners. It is repeated rather than
 * stretched, which would smear its scratches; the last tile is cut to fit.
 */
function addTitleBar(frame: WoWAPI.Frame, width: number) {
    const tile = ATLAS.frameTitle;
    const start = ATLAS.frameTopLeft.width - ATLAS.frameTopLeft.outsetX;
    const end = width - (ATLAS.frameTopRight.width - ATLAS.frameTopRight.outsetX);
    for (let x = start; x < end; x += tile.width) {
        const tileWidth = Math.min(tile.width, end - x);
        const texture = createAtlasTexture(frame, tile, 'OVERLAY');
        texture.SetWidth(tileWidth);
        texture.SetTexCoord(tile.left, tile.left + (tile.right - tile.left) * tileWidth / tile.width,
            tile.top, tile.bottom);
        texture.SetPoint('TOPLEFT', x, 0);
    }
}

/**
 * The retail window frame of Dragonflight and later: metal corners, a stone
 * title bar and thin rails, every piece placed so its rail runs along the
 * frame's edge. The rails are uniform along their length and stretch cleanly.
 */
export function addWindowFrame(frame: WoWAPI.Frame, width: number) {
    placeCorner(frame, ATLAS.frameTopLeft, 'TOPLEFT');
    placeCorner(frame, ATLAS.frameTopRight, 'TOPRIGHT');
    placeCorner(frame, ATLAS.frameBottomLeft, 'BOTTOMLEFT');
    placeCorner(frame, ATLAS.frameBottomRight, 'BOTTOMRIGHT');
    addTitleBar(frame, width);

    const left = createAtlasTexture(frame, ATLAS.frameLeft, 'OVERLAY');
    left.SetPoint('TOPLEFT', -ATLAS.frameLeft.outsetX, -ATLAS.frameTopLeft.height);
    left.SetPoint('BOTTOMLEFT', -ATLAS.frameLeft.outsetX,
        ATLAS.frameBottomLeft.height - ATLAS.frameBottomLeft.outsetY);

    const right = createAtlasTexture(frame, ATLAS.frameRight, 'OVERLAY');
    right.SetPoint('TOPRIGHT', ATLAS.frameRight.outsetX, -ATLAS.frameTopRight.height);
    right.SetPoint('BOTTOMRIGHT', ATLAS.frameRight.outsetX,
        ATLAS.frameBottomRight.height - ATLAS.frameBottomRight.outsetY);

    const bottom = createAtlasTexture(frame, ATLAS.frameBottom, 'OVERLAY');
    bottom.SetPoint('BOTTOMLEFT', ATLAS.frameBottomLeft.width - ATLAS.frameBottomLeft.outsetX,
        -ATLAS.frameBottom.outsetY);
    bottom.SetPoint('BOTTOMRIGHT', -(ATLAS.frameBottomRight.width - ATLAS.frameBottomRight.outsetX),
        -ATLAS.frameBottom.outsetY);
}
