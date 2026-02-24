local integrations = require 'bridge.options.integrations'
local side = IsDuplicityVersion() and 'server' or 'client'

-- Run registration side effects for the first started phone bridge only.
-- This keeps app registration deterministic when multiple phones are installed.
for i = 1, #integrations do
    local resource, dirName = table.unpack(integrations[i])
    if GetResourceState(resource):find('start') then
        local path = ('bridge.%s.imports.%s'):format(dirName, side)
        local resourceFilePath = ('%s.lua'):format(path:gsub('%.', '/'))

        if LoadResourceFile(GetCurrentResourceName(), resourceFilePath) then
            require(path)

            break
        end
    end
end
