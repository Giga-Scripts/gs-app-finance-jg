RegisterNetEvent(Config.AppIdentifier .. ':server:phoneNotification', function(text)
    local src = source

    exports.yphone:SendNotification({
        app = Config.AppIdentifier,
        title = Config.AppName,
        text = text,
        icon = ("https://cfx-nui-%s/ui/icon.png"):format(GetCurrentResourceName())
    }, 'source', src)
end)
