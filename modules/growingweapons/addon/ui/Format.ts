/** Whole numbers with thousands separators: 12345 -> "12,345". */
export function formatNumber(value: number) {
    const digits = `${Math.floor(value)}`;
    let formatted = '';
    for (let index = 0; index < digits.length; index++) {
        if (index > 0 && (digits.length - index) % 3 === 0) {
            formatted += ',';
        }
        formatted += digits.charAt(index);
    }
    return formatted;
}

/** "+12 Agility". */
export function formatBonus(amount: number, label: string) {
    return `+${formatNumber(amount)} ${label}`;
}

export type Color = [number, number, number];

export const COLORS = {
    gold: [1, 0.82, 0] as Color,
    artifact: [0.9, 0.8, 0.5] as Color,
    white: [1, 1, 1] as Color,
    green: [0.25, 1, 0.25] as Color,
    gray: [0.6, 0.6, 0.6] as Color,
    orange: [1, 0.55, 0.25] as Color,
};

export function setTextColor(text: WoWAPI.FontString, [r, g, b]: Color) {
    text.SetTextColor(r, g, b);
}
