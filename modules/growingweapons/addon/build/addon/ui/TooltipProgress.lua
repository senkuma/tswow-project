local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__New = ____lualib.__TS__New
local __TS__Number = ____lualib.__TS__Number
tstl_register_module(
    "TSAddons.growingweapons.addon.ui.TooltipProgress",
    function()
        local ____exports = {}
        local itemIdOf, reservePanelSpace, LINE_GAP, TOOLTIP_PADDING, PANEL_MARGIN
        local ____TooltipStats = require("TSAddons.growingweapons.addon.ui.TooltipStats")
        local showGrownStats = ____TooltipStats.showGrownStats
        local ____WeaponProgressPanel = require("TSAddons.growingweapons.addon.ui.WeaponProgressPanel")
        local PANEL_MIN_WIDTH = ____WeaponProgressPanel.PANEL_MIN_WIDTH
        local panelHeight = ____WeaponProgressPanel.panelHeight
        local WeaponProgressPanel = ____WeaponProgressPanel.WeaponProgressPanel
        function itemIdOf(link)
            local id = strmatch(link, "item:(%d+)")
            local ____temp_2
            if id == nil then
                ____temp_2 = nil
            else
                ____temp_2 = __TS__Number(id)
            end
            return ____temp_2
        end
        function reservePanelSpace(tooltip, height)
            local firstLine = tooltip:NumLines() + 1
            tooltip:AddLine(" ")
            local anchor = _G[(tooltip:GetName() .. "TextLeft") .. tostring(firstLine)]
            local ____, fontHeight = anchor:GetFont()
            local lines = math.ceil((height + PANEL_MARGIN) / (fontHeight + LINE_GAP))
            do
                local line = 1
                while line < lines do
                    tooltip:AddLine(" ")
                    line = line + 1
                end
            end
            tooltip:SetMinimumWidth(PANEL_MIN_WIDTH + TOOLTIP_PADDING * 2)
            tooltip:Show()
            return anchor
        end
        --- Tooltips that show items: hovered, linked in chat, and the two comparison tooltips.
        local ITEM_TOOLTIPS = {"GameTooltip", "ItemRefTooltip", "ShoppingTooltip1", "ShoppingTooltip2"}
        LINE_GAP = 2
        TOOLTIP_PADDING = 10
        PANEL_MARGIN = 4
        --- Shows the grown stats in the tooltip of every growing weapon the server has
        -- reported, and adds its progress panel below them. Tooltips cannot hold
        -- frames as lines, so blank lines reserve the panel's height and the panel is
        -- laid over them.
        ____exports.TooltipProgress = __TS__Class()
        local TooltipProgress = ____exports.TooltipProgress
        TooltipProgress.name = "TooltipProgress"
        function TooltipProgress.prototype.____constructor(self, stateOf)
            self.stateOf = stateOf
            self.attached = {}
            __TS__ArrayForEach(
                ITEM_TOOLTIPS,
                function(____, name)
                    local tooltip = _G[name]
                    if tooltip ~= nil then
                        self:attach(tooltip)
                    end
                end
            )
        end
        function TooltipProgress.prototype.refresh(self, state)
            __TS__ArrayForEach(
                __TS__ArrayFilter(
                    self.attached,
                    function(____, entry) return entry.item == state.item end
                ),
                function(____, entry) return entry.panel:update(state) end
            )
        end
        function TooltipProgress.prototype.attach(self, tooltip)
            local entry = {
                tooltip = tooltip,
                panel = __TS__New(WeaponProgressPanel, tooltip)
            }
            local ____self_attached_0 = self.attached
            ____self_attached_0[#____self_attached_0 + 1] = entry
            local hooks = tooltip
            hooks:HookScript(
                "OnTooltipSetItem",
                function() return self:onSetItem(entry) end
            )
            hooks:HookScript(
                "OnTooltipCleared",
                function() return self:clear(entry) end
            )
            tooltip:HookScript(
                "OnHide",
                function() return self:clear(entry) end
            )
        end
        function TooltipProgress.prototype.onSetItem(self, entry)
            local ____, link = entry.tooltip:GetItem()
            local ____temp_1
            if link == nil then
                ____temp_1 = nil
            else
                ____temp_1 = itemIdOf(link)
            end
            local item = ____temp_1
            if item == nil or item == entry.item then
                return
            end
            local state = self.stateOf(item)
            if state == nil then
                return
            end
            showGrownStats(entry.tooltip, state)
            local firstLine = reservePanelSpace(
                entry.tooltip,
                panelHeight(#state.bonuses)
            )
            local frame = entry.panel.frame
            frame:ClearAllPoints()
            frame:SetPoint("TOPLEFT", firstLine, "TOPLEFT")
            frame:SetPoint(
                "RIGHT",
                entry.tooltip,
                "RIGHT",
                -TOOLTIP_PADDING,
                0
            )
            entry.panel:show(state)
            entry.item = item
        end
        function TooltipProgress.prototype.clear(self, entry)
            if entry.item ~= nil then
                entry.panel:hide()
                entry.tooltip:SetMinimumWidth(0)
                entry.item = nil
            end
        end
        return ____exports
    end
)
