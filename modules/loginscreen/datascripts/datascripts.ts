import { std } from "wow/wotlk";

// Scenes shipped with the 3.3.5 client, under Interface\Glues\Models:
//   UI_MainMenu                - classic Dark Portal
//   UI_MainMenu_BurningCrusade - Dark Portal, Burning Crusade
//   UI_MainMenu_Northrend      - Wrath of the Lich King (default)
const LOGIN_SCENE = 'UI_MainMenu_BurningCrusade';
// SoundEntries names: GS_Retail, GS_BurningCrusade, GS_LichKing (default).
const LOGIN_MUSIC = 'GS_BurningCrusade';

std.LUAXML.file('Interface/GlueXML/AccountLogin.lua').replace(
    'UI_MainMenu_Northrend.m2',
    `\t\tAccountLogin:SetModel("Interface\\\\Glues\\\\Models\\\\${LOGIN_SCENE}\\\\${LOGIN_SCENE}.m2");`);

std.LUAXML.file('Interface/GlueXML/GlueParent.lua').replace(
    'CurrentGlueMusic = ',
    `CurrentGlueMusic = "${LOGIN_MUSIC}";`);
