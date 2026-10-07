local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Error = ____lualib.Error
local RangeError = ____lualib.RangeError
local ReferenceError = ____lualib.ReferenceError
local SyntaxError = ____lualib.SyntaxError
local TypeError = ____lualib.TypeError
local URIError = ____lualib.URIError
local __TS__New = ____lualib.__TS__New
local __TS__ArraySplice = ____lualib.__TS__ArraySplice
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayReduce = ____lualib.__TS__ArrayReduce
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
DBEntry = __TS__Class()
DBEntry.name = "DBEntry"
function DBEntry.prototype.____constructor(self)
end
DBArrayEntry = __TS__Class()
DBArrayEntry.name = "DBArrayEntry"
function DBArrayEntry.prototype.____constructor(self)
    self.__index = 0
    self.__isRemoved = false
    self.__isDirty = false
end
function DBArrayEntry.prototype.MarkDirty(self)
    self.__isDirty = true
end
function DBArrayEntry.prototype.Delete(self)
    self.__isRemoved = true
end
function DBArrayEntry.prototype.IsDeleted(self)
    return self.__isRemoved
end
function DBArrayEntry.prototype.IsDirty(self)
    return self.__isDirty
end
DBContainer = __TS__Class()
DBContainer.name = "DBContainer"
function DBContainer.prototype.____constructor(self)
    self.values = {}
end
function DBContainer.prototype.Size(self)
    return #self:nonDeletedValues()
end
function DBContainer.prototype.TotalSize(self)
    return #self.values
end
function DBContainer.prototype.__Add(self, value)
    local ____self_values_0 = self.values
    ____self_values_0[#____self_values_0 + 1] = value
end
function DBContainer.prototype.Add(self, value)
    if value.__container then
        error(
            __TS__New(Error, "Attempted to add DBArrayEntry to multiple containers"),
            0
        )
    end
    value.__isRemoved = false
    value.__isDirty = true
    value.__container = self
    local ____self_values_1 = self.values
    ____self_values_1[#____self_values_1 + 1] = value
    return value
end
function DBContainer.prototype.Save(self)
    if #self.values == 0 then
        return
    end
    do
        local i = 0
        while i < #self.values do
            local val = self.values[i + 1]
            if val:IsDeleted() then
                if val.__index > 0 then
                    val:_Delete()
                end
                __TS__ArraySplice(self.values, i, 1)
            else
                if val:IsDirty() then
                    val:Save()
                    val.__isDirty = false
                end
                i = i + 1
            end
        end
    end
end
function DBContainer.prototype.nonDeletedValues(self)
    return __TS__ArrayFilter(
        self.values,
        function(____, x) return not x:IsDeleted() end
    )
end
function DBContainer.prototype.forEach(self, callback)
    __TS__ArrayForEach(
        self:nonDeletedValues(),
        function(____, x) return callback(x) end
    )
end
function DBContainer.prototype.reduce(self, callback, init)
    return __TS__ArrayReduce(
        self:nonDeletedValues(),
        function(____, v, value) return callback(v, value) end,
        init
    )
end
function DBContainer.prototype.find(self, callback)
    return __TS__ArrayFind(
        self:nonDeletedValues(),
        function(____, value) return callback(value) end
    )
end
function DBContainer.prototype.ToArray(self)
    return self:nonDeletedValues()
end
function CreateDBContainer()
    return __TS__New(DBContainer)
end
