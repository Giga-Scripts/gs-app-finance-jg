local resourceName = GetCurrentResourceName()

local function AddApp()
    local dataLoaded = exports.yseries:GetDataLoaded()
    while not dataLoaded do
        Wait(500)
        dataLoaded = exports.yseries:GetDataLoaded()
    end

    exports.yseries:AddCustomApp({
        key = Config.AppIdentifier,
        name = Config.AppName,
        defaultApp = false,
        icon = {
            yos = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
            humanoid = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
        },
        ui = ("https://cfx-nui-%s/ui/dist/index.html"):format(resourceName),
    })

    print('Giga Cred app added (yseries).')
end

AddEventHandler("onResourceStop", function(resource)
    if resource == resourceName then
        exports.yseries:RemoveCustomApp(Config.AppIdentifier)
    end
end)

AddEventHandler("onResourceStart", function(resource)
    if resource == "yseries" then
        while GetResourceState("yseries") ~= "started" do
            Wait(500)
        end

        AddApp()
    end
end)

CreateThread(function()
    while GetResourceState("yseries") ~= "started" do
        Wait(500)
    end

    AddApp()
end)
