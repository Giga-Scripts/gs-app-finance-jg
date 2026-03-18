local resourceName = GetCurrentResourceName()

local function AddApp()
    local dataLoaded = exports.yphone:GetDataLoaded()
    while not dataLoaded do
        Wait(500)
        dataLoaded = exports.yphone:GetDataLoaded()
    end

    exports.yphone:AddCustomApp({
        key = Config.AppIdentifier,
        name = Config.AppName,
        defaultApp = false,
        icon = {
            yos = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
            humanoid = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
        },
        ui = ("https://cfx-nui-%s/ui/dist/index.html"):format(resourceName),
    })

    print('Giga Cred app added (yphone).')
end

AddEventHandler("onResourceStop", function(resource)
    if resource == resourceName then
        exports.yphone:RemoveCustomApp(Config.AppIdentifier)
    end
end)

AddEventHandler("onResourceStart", function(resource)
    if resource == "yphone" then
        while GetResourceState("yphone") ~= "started" do
            Wait(500)
        end

        AddApp()
    end
end)

CreateThread(function()
    while GetResourceState("yphone") ~= "started" do
        Wait(500)
    end

    AddApp()
end)
