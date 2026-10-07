/**
 * The server refuses Chi spenders with the combo point error, the closest
 * WotLK has; monks see it as Chi.
 */
const NOT_ENOUGH_CHI = 'Not enough Chi';

interface ErrorsFrame {
    AddMessage(message: string, ...rest: unknown[]): void;
}

export function showChiErrors() {
    const comboPointError: string = _G['SPELL_FAILED_NO_COMBO_POINTS'];
    const errors: ErrorsFrame = _G['UIErrorsFrame'];
    const addMessage = errors.AddMessage;
    errors.AddMessage = function (this: ErrorsFrame, message: string, ...rest: unknown[]) {
        addMessage.call(this, message === comboPointError ? NOT_ENOUGH_CHI : message, ...rest);
    };
}
