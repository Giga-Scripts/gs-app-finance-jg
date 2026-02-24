CreateThread(function()
    while GetResourceState("lb-phone") ~= "started" do
        Wait(500)
    end

    local added, errorMessage = exports["lb-phone"]:AddCustomApp({
        identifier = Config.AppIdentifier,
        name = Config.AppName,
        description = Config.AppDescription,
        developer = Config.AppDeveloper,
        defaultApp = false,
        size = 59812,
        fixBlur = true,
        icon = ("https://cfx-nui-%s/ui/icon.png"):format(GetCurrentResourceName()),
        ui = ("https://cfx-nui-%s/ui/dist/index.html"):format(GetCurrentResourceName()),
        -- These screenshots are served from ui/public/store/* and copied to ui/dist/store/* on `npm run build`.
        images = {
            ("https://cfx-nui-%s/ui/dist/store/screenshot-1.png"):format(GetCurrentResourceName()),
            ("https://cfx-nui-%s/ui/dist/store/screenshot-2.png"):format(GetCurrentResourceName()),
        },
    })

    if not added then
        print(('Could not add app: %s'):format(tostring(errorMessage)))
        return
    end

    print('Giga Cred app added (lb-phone).')
end)
