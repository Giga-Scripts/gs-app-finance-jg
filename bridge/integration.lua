local integrations = require 'bridge.options.integrations'
local side = IsDuplicityVersion() and 'server' or 'client'

local integration

-- Load the first started phone bridge from the configured priority list.
-- `LoadResourceFile` guards against optional bridge folders that may not exist.
for i = 1, #integrations do
    local resource, dirName = table.unpack(integrations[i])

    if GetResourceState(resource):find('start') then
        local path = ('bridge.%s.%s'):format(dirName, side)
        local resourceFilePath = ('%s.lua'):format(path:gsub('%.', '/'))

        if LoadResourceFile(GetCurrentResourceName(), resourceFilePath) and not integration then
            integration = require(path)

            break
        end
    end
end

return integration
