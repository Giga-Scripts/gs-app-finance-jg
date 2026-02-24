local resourceName = GetCurrentResourceName()

CreateThread(function()
    while GetResourceState('gksphone') ~= 'started' do
        Wait(500)
    end

    local appData = {
        name = Config.AppIdentifier,
        icons = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
        description = Config.AppDescription,
        appurl = ("https://cfx-nui-%s/ui/dist/index.html"):format(resourceName),
        url = '/customapp',
        blockedjobs = {},
        allowjob = {},
        signal = true,
        show = true,
        categori = 'finance',
        labelLangs = {
            en = Config.AppName,
            ['pt-PT'] = Config.AppName,
        },
    }

    exports['gksphone']:AddCustomApp(appData)

    print('Giga Cred app added (gksphone).')
end)
