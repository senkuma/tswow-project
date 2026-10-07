local ____lualib = require("lualib_bundle")
local __TS__ArrayForEach = ____lualib.__TS__ArrayForEach
local __TS__Delete = ____lualib.__TS__Delete
local __TS__ObjectKeys = ____lualib.__TS__ObjectKeys
tstl_register_module(
    "TSAddons.detailscompat.addon.Specializations",
    function()
        local ____exports = {}
        local ACTOR_CONTAINERS = {1, 2, 3, 4}
        --- DetailsFramework maps a class's talent tree to a retail specialization id,
        -- and answers 0 for classes it has no ids for (the custom ones) or players
        -- with no talents. Details stores that 0 as the player's specialization and
        -- then fails looking up its icon; nothing makes it fall back to the class
        -- icon, which an unknown specialization does.
        function ____exports.wrapSpecializationInfo(framework)
            local getSpecializationInfo = framework.GetSpecializationInfo
            framework.GetSpecializationInfo = function(index)
                local specId = getSpecializationInfo(index)
                local ____temp_0
                if specId == 0 then
                    ____temp_0 = nil
                else
                    ____temp_0 = specId
                end
                return ____temp_0
            end
        end
        --- Clears specializations without an icon from saved combats and the spec cache, so Details shows class icons.
        function ____exports.forgetUnknownSpecs(details)
            local icons = details.class_specs_coords
            if icons == nil then
                return
            end
            local combats = {details.tabela_vigente, details.tabela_overall}
            local ____details_tabela_historico_tabelas_2 = details.tabela_historico
            if ____details_tabela_historico_tabelas_2 ~= nil then
                ____details_tabela_historico_tabelas_2 = ____details_tabela_historico_tabelas_2.tabelas
            end
            __TS__ArrayForEach(
                ____details_tabela_historico_tabelas_2 or ({}),
                function(____, combat)
                    local ____temp_1 = #combats + 1
                    combats[____temp_1] = combat
                    return ____temp_1
                end
            )
            __TS__ArrayForEach(
                combats,
                function(____, combat) return __TS__ArrayForEach(
                    ACTOR_CONTAINERS,
                    function(____, index)
                        local ____combat_index_6 = combat
                        if ____combat_index_6 ~= nil then
                            ____combat_index_6 = ____combat_index_6[index]
                        end
                        local ____combat_index__ActorTable_4 = ____combat_index_6
                        if ____combat_index__ActorTable_4 ~= nil then
                            ____combat_index__ActorTable_4 = ____combat_index__ActorTable_4._ActorTable
                        end
                        __TS__ArrayForEach(
                            ____combat_index__ActorTable_4 or ({}),
                            function(____, actor)
                                if actor.spec ~= nil and icons[actor.spec] == nil then
                                    actor.spec = nil
                                end
                            end
                        )
                    end
                ) end
            )
            local cached = details.cached_specs or ({})
            __TS__ArrayForEach(
                __TS__ObjectKeys(cached),
                function(____, guid)
                    if icons[cached[guid]] == nil then
                        __TS__Delete(cached, guid)
                    end
                end
            )
        end
        return ____exports
    end
)
