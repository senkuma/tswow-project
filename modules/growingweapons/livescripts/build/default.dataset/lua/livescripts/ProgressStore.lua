local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__New = ____lualib.__TS__New
local ____exports = {}
local rowOf, loaded
function rowOf(item)
    local guid = item:GetGUIDLow()
    local row = loaded[guid]
    if row == nil then
        row = __TS__New(____exports.GrowingWeaponProgress, guid)
        row:Load()
        loaded[guid] = row
    end
    return row
end
--- One weapon's progress in the characters database, keyed by the item's GUID.
____exports.GrowingWeaponProgress = __TS__Class()
local GrowingWeaponProgress = ____exports.GrowingWeaponProgress
GrowingWeaponProgress.name = "GrowingWeaponProgress"
__TS__ClassExtends(GrowingWeaponProgress, DBEntry)
function GrowingWeaponProgress.prototype.____constructor(self, itemGuid)
    DBEntry.prototype.____constructor(self)
    self.itemGuid = 0
    self.level = 1
    self.experience = 0
    self.itemGuid = itemGuid
end
__TS__Decorate({DBPrimaryKey}, GrowingWeaponProgress.prototype, "itemGuid", nil)
__TS__Decorate({DBField}, GrowingWeaponProgress.prototype, "level", nil)
__TS__Decorate({DBField}, GrowingWeaponProgress.prototype, "experience", nil)
GrowingWeaponProgress = __TS__Decorate({CharactersTable}, GrowingWeaponProgress)
____exports.GrowingWeaponProgress = GrowingWeaponProgress
loaded = {}
--- A weapon's progress; level 1 with no experience until it first earns some.
function ____exports.progressOf(item)
    local row = rowOf(item)
    return {level = row.level, experience = row.experience}
end
function ____exports.saveProgress(item, progress)
    local row = rowOf(item)
    row.level = progress.level
    row.experience = progress.experience
    row:Save()
end



-- GrowingWeaponProgress ORM Code
CreateDatabaseSpec(
    2,
    CharactersDatabaseInfo():Database(),
    "growingweaponprogress",
    {
        {"itemguid","int(10) unsigned",true,false},
        {"level","int(10) unsigned",false,false},
        {"experience","int(10) unsigned",false,false},
    }
)
local __GrowingWeaponProgress__loadStatement = PrepareCharactersQuery(
       " SELECT `itemguid`,`level`,`experience`"
    .. " FROM"
    .. "     `growingweaponprogress`"
    .. " WHERE"
    .. "    `itemguid` = ?;"
)
function GrowingWeaponProgress.prototype.Load(self)
    local res = __GrowingWeaponProgress__loadStatement:Create()
        :SetUInt32(0,self.itemGuid)
        :Send()
    if not res:GetRow() then return end
    self.itemGuid = res:GetUInt32(0);
    self.level = res:GetUInt32(1);
    self.experience = res:GetUInt32(2);
end
function GrowingWeaponProgress.LoadSQL(sql)
    local arr = {}
    local res = QueryCharacters(
           " SELECT "
        .. "     `itemguid`,`level`,`experience`"
        .. " FROM"
        .. "     `growingweaponprogress`"
        .. " " .. sql .. ";"
    )
    while(res:GetRow()) do
        local value = ____lualib.__TS__New(GrowingWeaponProgress)
        value.itemGuid = res:GetUInt32(0);
        value.level = res:GetUInt32(1);
        value.experience = res:GetUInt32(2);
        arr[#arr + 1] = value    end
    return arr
end
local __GrowingWeaponProgress__saveStatement = PrepareCharactersQuery(
       " REPLACE INTO `growingweaponprogress`"
    .. "    (`itemguid`,`level`,`experience`)"
    .. " VALUES "
    .. "    (?,?,?);"
)
function GrowingWeaponProgress.prototype.Save(self)
    __GrowingWeaponProgress__saveStatement:Create()
        :SetUInt32(0,self.itemGuid)
        :SetUInt32(1,self.level)
        :SetUInt32(2,self.experience)
        :Send()
end
local __GrowingWeaponProgress__deleteStatement = PrepareCharactersQuery(
       " DELETE FROM `growingweaponprogress`"
    .. " WHERE "
    .. "    `itemguid` = ?;"
)
function GrowingWeaponProgress.prototype.Delete(self)
    __GrowingWeaponProgress__deleteStatement:Create()
        :SetUInt32(0,self.itemGuid)
        :Send()
end
function GrowingWeaponProgress.DeleteSQL(sql)
    QueryCharacters(
        " DELETE FROM `growingweaponprogress` " .. sql .. ";"
    )
end
return ____exports
