local integration = {}

---@param text string
function integration.sendNotification(text)
    exports['gksphone']:Notification({
        title = Config.AppName,
        message = text,
        icon = ("https://cfx-nui-%s/ui/icon.png"):format(GetCurrentResourceName()),
        duration = 5000,
        type = 'success',
    })
end

return integration
