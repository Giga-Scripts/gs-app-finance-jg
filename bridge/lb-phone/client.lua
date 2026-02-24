local integration = {}

---@param text string
function integration.sendNotification(text)
    exports["lb-phone"]:SendNotification({
        app = Config.AppIdentifier,
        title = Config.AppName,
        content = text,
    })
end

return integration
