local integration = {}

---@param text string
function integration.sendNotification(text)
    exports['17mov_Phone']:CreateNotification({
        app = Config.AppIdentifier,
        title = Config.AppName,
        message = text,
    })
end

return integration
