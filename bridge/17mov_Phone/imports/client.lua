local resourceName = GetCurrentResourceName()

local function AddApp()
    exports['17mov_Phone']:AddApplication({
        name = Config.AppIdentifier,
        label = Config.AppName,
        ui = ("https://cfx-nui-%s/ui/dist/index.html"):format(resourceName),
        icon = ("https://cfx-nui-%s/ui/icon.png"):format(resourceName),
        iconBackground = {
            angle = 135,
            colors = { '#C9A96E', '#8B7340' },
        },
        default = false,
        preInstalled = true,
        resourceName = resourceName,
        rating = 5.0,
    })

    print('Giga Cred app added (17mov_Phone).')
end

CreateThread(function()
    while GetResourceState('17mov_Phone') ~= 'started' do
        Wait(500)
    end

    AddApp()
end)

RegisterNetEvent('17mov_Phone:Client:Ready', AddApp)
