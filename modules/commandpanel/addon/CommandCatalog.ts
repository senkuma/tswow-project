/**
 * Every chat command the server's modules add, as buttons. Each livescript
 * that handles a command is named beside it; keep this list in step with them.
 */
export interface CommandButton {
    label: string;
    /** What the button does, shown in its tooltip. */
    description: string;
    /** The chat command it types, also shown in its tooltip so it can be typed by hand. */
    command: string;
    /** Class files (as UnitClass returns them) the button is for; every class when omitted. */
    classes?: string[];
    /** A number typed after the command, entered in a box beside the button. */
    amount?: { default: number };
    /** Done instead of typing the command, e.g. opening another addon's window. */
    run?: () => void;
}

export interface CommandSection {
    title: string;
    buttons: CommandButton[];
}

export const COMMAND_SECTIONS: CommandSection[] = [
    {
        // growingweapons/livescripts/WeaponCommand.ts
        title: 'Growing Weapons',
        buttons: [
            {
                label: 'Get growing weapons',
                description: 'Adds every growing weapon your class can use to your bags.',
                command: '.growingweapon add',
            },
            {
                label: 'Grant weapon XP',
                description: 'Gives your carried and equipped growing weapons this much experience.',
                command: '.growingweapon xp',
                amount: { default: 5000 },
            },
        ],
    },
    {
        // monk/livescripts/GearCommand.ts
        title: 'Monk',
        buttons: [
            {
                label: 'Jade Serpent gear',
                description: 'Adds Battlegear of the Jade Serpent and its fist weapons to your bags.',
                command: '.monkgear',
            },
        ],
    },
    {
        // marauder/livescripts/GearCommand.ts
        title: 'Marauder',
        buttons: [
            {
                label: 'Dreadcorsair gear',
                description: 'Adds Dreadcorsair Battlegear and its weapons to your bags.',
                command: '.maraudergear',
            },
        ],
    },
    {
        // mountainking/livescripts/GearCommand.ts and hero/HeroTalents.ts
        title: 'Mountain King',
        buttons: [
            {
                label: 'Mountain King gear',
                description: 'Adds Battlegear of the Mountain King to your bags.',
                command: '.mountainkinggear battlegear',
            },
            {
                label: 'Titanstorm gear',
                description: 'Adds Titanstorm Battlegear to your bags.',
                command: '.mountainkinggear titanstorm',
            },
            {
                label: 'Hero talents',
                description: 'Opens the hero talent window.',
                command: '/hero',
                classes: ['MOUNTAINKING'],
                run: () => SlashCmdList['MKHERO']?.(''),
            },
            {
                label: 'Reset hero talents',
                description: 'Forgets your hero talents so you can choose again.',
                command: '.mkhero reset',
                classes: ['MOUNTAINKING'],
            },
        ],
    },
];
