import { AtlasPiece, PARTS_TEXTURE } from "./WeaponArt";

/** A texture showing one atlas piece at its display size. */
export function createAtlasTexture(frame: WoWAPI.Frame, piece: AtlasPiece, layer: WoWAPI.Layer) {
    const texture = frame.CreateTexture(undefined, layer);
    texture.SetTexture(PARTS_TEXTURE);
    texture.SetTexCoord(piece.left, piece.right, piece.top, piece.bottom);
    texture.SetSize(piece.width, piece.height);
    return texture;
}

/** Shows the left `fraction` of a horizontal piece, as a status bar fill does. */
export function cropAtlasWidth(texture: WoWAPI.Texture, piece: AtlasPiece, fraction: number) {
    texture.SetWidth(piece.width * fraction);
    texture.SetTexCoord(piece.left, piece.left + (piece.right - piece.left) * fraction, piece.top, piece.bottom);
}

/** Texture:SetGradientAlpha, which TSWoW's declarations leave out. */
interface GradientTexture {
    SetGradientAlpha(orientation: 'HORIZONTAL' | 'VERTICAL',
        minR: number, minG: number, minB: number, minA: number,
        maxR: number, maxG: number, maxB: number, maxA: number): void;
}

/** A black shade fading from `startAlpha` (left or bottom) to `endAlpha` (right or top). */
export function createShade(frame: WoWAPI.Frame, layer: WoWAPI.Layer, orientation: 'HORIZONTAL' | 'VERTICAL',
    startAlpha: number, endAlpha: number) {
    const texture = frame.CreateTexture(undefined, layer);
    texture.SetTexture(1, 1, 1, 1);
    (texture as unknown as GradientTexture).SetGradientAlpha(orientation, 0, 0, 0, startAlpha, 0, 0, 0, endAlpha);
    return texture;
}
