local function AddApp()
    local dataLoaded = exports.yphone:GetDataLoaded()
    while not dataLoaded do
        Wait(1000)
        dataLoaded = exports.yphone:GetDataLoaded()
    end

    local added, errorMessage = exports.yphone:AddCustomApp({
        key = Config.AppIdentifier,
        name = Config.AppName,
        defaultApp = false,
        icon = {
            yos = ("https://cfx-nui-%s/ui/icon.png"):format(GetCurrentResourceName()),
            humanoid = ("https://cfx-nui-%s/ui/icon.png"):format(GetCurrentResourceName()),
        },
        ui = ("https://cfx-nui-%s/ui/dist/index.html"):format(GetCurrentResourceName()),
    })

    if not added then
        print(('Could not add app: %s'):format(tostring(errorMessage)))
        return
    end

    print('Giga Cred app added (yphone).')
end

CreateThread(function()
    while GetResourceState("yphone") ~= "started" do
        Wait(500)
    end

    AddApp()
end)
