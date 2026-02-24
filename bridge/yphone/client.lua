local integration = {}

---@param text string
function integration.sendNotification(text)
    TriggerServerEvent(Config.AppIdentifier .. ':server:phoneNotification', text)
end

return integration
