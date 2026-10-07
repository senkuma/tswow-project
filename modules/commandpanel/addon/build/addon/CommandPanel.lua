local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayIndexOf = ____lualib.__TS__ArrayIndexOf
local __TS__Number = ____lualib.__TS__Number
tstl_register_module(
    "TSAddons.commandpanel.addon.CommandPanel",
    function()
        local ____exports = {}
        local addTitle, addCommandButton, addAmountBox, amountOf, BUTTON_HEIGHT, BUTTON_WIDTH, AMOUNT_WIDTH, AMOUNT_GAP, COMMAND_COLOR, DISABLED_COLOR
        local ____CommandCatalog = require("TSAddons.commandpanel.addon.CommandCatalog")
        local COMMAND_SECTIONS = ____CommandCatalog.COMMAND_SECTIONS
        function addTitle(frame, text)
            local banner = frame:CreateTexture(nil, "ARTWORK")
            banner:SetTexture("Interface\\DialogFrame\\UI-DialogBox-Header")
            banner:SetSize(256, 64)
            banner:SetPoint("TOP", 0, 12)
            local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
            title:SetPoint(
                "TOP",
                banner,
                "TOP",
                0,
                -14
            )
            title:SetText(text)
        end
        function addCommandButton(frame, command, x, y, playerClass)
            local button = CreateFrame("Button", nil, frame, "UIPanelButtonTemplate")
            local ____temp_1
            if command.amount == nil then
                ____temp_1 = BUTTON_WIDTH
            else
                ____temp_1 = BUTTON_WIDTH - AMOUNT_WIDTH - AMOUNT_GAP
            end
            local width = ____temp_1
            button:SetSize(width, BUTTON_HEIGHT)
            button:SetPoint("TOPLEFT", x, -y)
            button:SetText(command.label)
            local available = command.classes == nil or __TS__ArrayIndexOf(command.classes, playerClass) >= 0
            if not available then
                button:Disable()
            end
            local hoverArea = CreateFrame("Frame", nil, frame)
            hoverArea:SetAllPoints(button)
            hoverArea:SetFrameLevel(button:GetFrameLevel() + 1)
            hoverArea:EnableMouse(not available)
            local function showTooltip(owner)
                GameTooltip:SetOwner(owner, "ANCHOR_RIGHT")
                GameTooltip:AddLine(command.label, 1, 1, 1)
                GameTooltip:AddLine(
                    command.description,
                    1,
                    0.82,
                    0,
                    true
                )
                GameTooltip:AddLine(((COMMAND_COLOR .. command.command) .. (command.amount == nil and "" or " <amount>")) .. "|r")
                if not available then
                    GameTooltip:AddLine(DISABLED_COLOR .. "Not available to your class.|r")
                end
                GameTooltip:Show()
            end
            button:SetScript(
                "OnEnter",
                function() return showTooltip(button) end
            )
            button:SetScript(
                "OnLeave",
                function() return GameTooltip:Hide() end
            )
            hoverArea:SetScript(
                "OnEnter",
                function() return showTooltip(hoverArea) end
            )
            hoverArea:SetScript(
                "OnLeave",
                function() return GameTooltip:Hide() end
            )
            local ____temp_2
            if command.amount == nil then
                ____temp_2 = nil
            else
                ____temp_2 = addAmountBox(frame, button, command.amount.default)
            end
            local amountBox = ____temp_2
            button:SetScript(
                "OnClick",
                function()
                    if command.run ~= nil then
                        command:run()
                    else
                        local amount = amountBox == nil and "" or " " .. tostring(amountOf(amountBox, command.amount.default))
                        SendChatMessage(command.command .. amount, "SAY")
                    end
                end
            )
        end
        function addAmountBox(frame, button, initial)
            local box = CreateFrame("EditBox", nil, frame, "InputBoxTemplate")
            box:SetSize(AMOUNT_WIDTH, BUTTON_HEIGHT)
            box:SetPoint(
                "LEFT",
                button,
                "RIGHT",
                AMOUNT_GAP,
                0
            )
            box:SetAutoFocus(false)
            box:SetNumeric()
            box:SetText(tostring(initial))
            box:SetScript(
                "OnEnterPressed",
                function() return box:ClearFocus() end
            )
            box:SetScript(
                "OnEscapePressed",
                function() return box:ClearFocus() end
            )
            return box
        end
        function amountOf(box, fallback)
            local amount = __TS__Number(box:GetText())
            if amount > 0 then
                return amount
            end
            box:SetText(tostring(fallback))
            return fallback
        end
        local FRAME_NAME = "TSWoWCommandPanel"
        local WIDTH = 380
        local PADDING = 20
        local TOP_OFFSET = 34
        local HEADER_HEIGHT = 18
        local SECTION_GAP = 10
        local COLUMNS = 2
        local COLUMN_GAP = 8
        local ROW_GAP = 4
        BUTTON_HEIGHT = 22
        BUTTON_WIDTH = (WIDTH - PADDING * 2 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS
        AMOUNT_WIDTH = 56
        AMOUNT_GAP = 8
        COMMAND_COLOR = "|cff9d9d9d"
        DISABLED_COLOR = "|cffff6060"
        local unitClass = UnitClass
        --- A window with a button for each command the server's modules add, grouped
        -- by module. Buttons type their command into chat, as if typed by hand.
        ____exports.CommandPanel = __TS__Class()
        local CommandPanel = ____exports.CommandPanel
        CommandPanel.name = "CommandPanel"
        function CommandPanel.prototype.____constructor(self)
            local frame = CreateFrame("Frame", FRAME_NAME, UIParent)
            frame:SetPoint("CENTER")
            frame:SetFrameStrata("DIALOG")
            frame:SetBackdrop({
                bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
                edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border",
                tile = true,
                tileSize = 32,
                edgeSize = 32,
                insets = {left = 11, right = 12, top = 12, bottom = 11}
            })
            frame:SetMovable(true)
            frame:EnableMouse(true)
            frame:SetClampedToScreen(true)
            frame:RegisterForDrag("LeftButton")
            frame:SetScript(
                "OnDragStart",
                function() return frame:StartMoving() end
            )
            frame:SetScript(
                "OnDragStop",
                function() return frame:StopMovingOrSizing() end
            )
            frame:Hide()
            local ____G_UISpecialFrames_0 = _G.UISpecialFrames
            ____G_UISpecialFrames_0[#____G_UISpecialFrames_0 + 1] = FRAME_NAME
            self.frame = frame
            addTitle(frame, "Commands")
            local close = CreateFrame("Button", nil, frame, "UIPanelCloseButton")
            close:SetPoint("TOPRIGHT", -4, -4)
            local ____, playerClass = unitClass("player")
            local top = TOP_OFFSET
            __TS__ArrayForEach(
                COMMAND_SECTIONS,
                function(____, section)
                    local header = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
                    header:SetPoint("TOPLEFT", PADDING, -top)
                    header:SetText(section.title)
                    top = top + HEADER_HEIGHT
                    __TS__ArrayForEach(
                        section.buttons,
                        function(____, command, index)
                            local x = PADDING + index % COLUMNS * (BUTTON_WIDTH + COLUMN_GAP)
                            local y = top + math.floor(index / COLUMNS) * (BUTTON_HEIGHT + ROW_GAP)
                            addCommandButton(
                                frame,
                                command,
                                x,
                                y,
                                playerClass
                            )
                        end
                    )
                    top = top + (math.ceil(#section.buttons / COLUMNS) * (BUTTON_HEIGHT + ROW_GAP) + SECTION_GAP)
                end
            )
            frame:SetSize(WIDTH, top + PADDING - SECTION_GAP)
        end
        function CommandPanel.prototype.toggle(self)
            if self.frame:IsShown() then
                self.frame:Hide()
            else
                self.frame:Show()
            end
        end
        return ____exports
    end
)
