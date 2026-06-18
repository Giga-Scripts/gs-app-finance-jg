VehicleImages = VehicleImages or {}

local jgVehicleStudioStarted = nil

---@return string
local function getImageSetId()
    local imageSet = Config.JGVehicleStudioImageSet
    if type(imageSet) ~= "string" or imageSet == "" then
        return "default"
    end
    return imageSet
end

---@return boolean
function VehicleImages.isEnabled()
    if Config.UseJGVehicleStudio == false then
        return false
    end

    if jgVehicleStudioStarted == nil then
        jgVehicleStudioStarted = GetResourceState("jg-vehiclestudio") == "started"
    end

    return jgVehicleStudioStarted
end

---@param spawnCodes string[]
---@return table<string, { image: string|nil, fallbacks: string[] }>
function VehicleImages.buildBatchCache(spawnCodes)
    local cache = {}
    if type(spawnCodes) ~= "table" or #spawnCodes == 0 then
        return cache
    end

    if not VehicleImages.isEnabled() then
        return cache
    end

    local imageSetId = getImageSetId()
    local success, images = pcall(function()
        if imageSetId == "default" then
            return exports["jg-vehiclestudio"]:getImages(spawnCodes)
        end
        return exports["jg-vehiclestudio"]:getImages(spawnCodes, imageSetId)
    end)

    if not success or type(images) ~= "table" then
        return cache
    end

    for spawnCode, result in pairs(images) do
        local key = tostring(spawnCode)
        if type(result) == "table" then
            cache[key] = {
                image = type(result.image) == "string" and result.image ~= "" and result.image or nil,
                fallbacks = type(result.fallbacks) == "table" and result.fallbacks or {},
            }
        elseif type(result) == "string" and result ~= "" then
            cache[key] = { image = result, fallbacks = {} }
        end
    end

    return cache
end

---@param target table
---@param model string|nil
---@param batchCache table<string, { image: string|nil, fallbacks: string[] }>|nil
function VehicleImages.applyFields(target, model, batchCache)
    model = model and tostring(model) or ""
    target.vehicle_image = nil
    target.vehicle_image_fallbacks = nil

    if model == "" then
        return
    end

    local studioImage, studioFallbacks = nil, {}

    if batchCache and batchCache[model] then
        studioImage = batchCache[model].image
        studioFallbacks = batchCache[model].fallbacks or {}
    elseif VehicleImages.isEnabled() then
        local imageSetId = getImageSetId()
        local success, image, fallbacks = pcall(function()
            if imageSetId == "default" then
                return exports["jg-vehiclestudio"]:getImage(model)
            end
            return exports["jg-vehiclestudio"]:getImage(model, imageSetId)
        end)

        if success then
            studioImage = type(image) == "string" and image ~= "" and image or nil
            studioFallbacks = type(fallbacks) == "table" and fallbacks or {}
        end
    end

    if studioImage then
        target.vehicle_image = studioImage
    end

    if #studioFallbacks > 0 then
        target.vehicle_image_fallbacks = studioFallbacks
    end
end
