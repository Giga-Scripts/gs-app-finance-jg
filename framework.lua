Config = Config or {}

-- Pull framework/payment settings from jg-dealerships so this app matches its finance rules.
if GetResourceState("jg-dealerships") == "started" then
  local ok = pcall(function()
    local dealerConfig = exports["jg-dealerships"]:config()
    for k, v in pairs(dealerConfig) do
      Config[k] = v
    end
  end)

  if not ok then
    print("^3[WARNING] You are using an old version of jg-dealerships; please use version 1.2 or newer")
  end
else
  print("^3[WARNING] jg-dealerships is not running")
end

QBCore, ESX = nil, nil
Framework = {
  Server = {}
}

-- Resolve the active framework and map table/identifier names used in SQL queries.
if (Config.Framework == "auto" and GetResourceState("qbx_core") == "started") or Config.Framework == "Qbox" then
  Config.Framework = "Qbox"

  Framework.VehiclesTable = "player_vehicles"
  Framework.PlayerIdentifier = "citizenid"
elseif (Config.Framework == "auto" and GetResourceState("qb-core") == "started") or Config.Framework == "QBCore" then
  QBCore = exports['qb-core']:GetCoreObject()
  Config.Framework = "QBCore"

  Framework.VehiclesTable = "player_vehicles"
  Framework.PlayerIdentifier = "citizenid"
elseif (Config.Framework == "auto" and GetResourceState("es_extended") == "started") or Config.Framework == "ESX" then
  ESX = exports["es_extended"]:getSharedObject()
  Config.Framework = "ESX"

  Framework.VehiclesTable = "owned_vehicles"
  Framework.PlayerIdentifier = "owner"
else
  error("You need to set Config.Framework to \"QBCore\", \"ESX\" or \"Qbox\"!")
end

---@param src integer
function Framework.Server.GetPlayer(src)
  if Config.Framework == "QBCore" then
    return QBCore.Functions.GetPlayer(src)
  elseif Config.Framework == "Qbox" then
    return exports.qbx_core:GetPlayer(src)
  elseif Config.Framework == "ESX" then
    return ESX.GetPlayerFromId(src)
  end
end

---@param src integer
function Framework.Server.GetPlayerIdentifier(src)
  local player = Framework.Server.GetPlayer(src)
  if not player then return false end

  if Config.Framework == "QBCore" or Config.Framework == "Qbox" then
    return player.PlayerData.citizenid
  elseif Config.Framework == "ESX" then
    return player.getIdentifier()
  end
end

---@param src integer
---@param type "cash" | "bank" | "money"
function Framework.Server.GetPlayerBalance(src, type)
  local player = Framework.Server.GetPlayer(src)
  if not player then return 0 end

  if type == "custom" then
    -- Add your own custom balance system here
  elseif Config.Framework == "QBCore" or Config.Framework == "Qbox" then
    return player.PlayerData.money[type]
  elseif Config.Framework == "ESX" then
    if type == "cash" then type = "money" end

    for i, acc in pairs(player.getAccounts()) do
      if acc.name == type then
        return acc.money
      end
    end

    return 0
  end
end

---@param src integer
---@param amount number
---@param account "cash" | "bank" | "money"
function Framework.Server.PlayerRemoveMoney(src, amount, account)
  local player = Framework.Server.GetPlayer(src)
  account = account or "bank"

  if account == "custom" then
    -- Add your own custom balance system here
  elseif Config.Framework == "QBCore" or Config.Framework == "Qbox" then
    player.Functions.RemoveMoney(account, Round(amount, 0))
  elseif Config.Framework == "ESX" then
    if account == "cash" then account = "money" end
    player.removeAccountMoney(account, Round(amount, 0))
  end
end

---@param num integer
---@param dp? integer
---@return number
function Round(num, dp)
  dp = dp or 0
  local mult = 10^(dp or 0)
  return math.floor(num * mult + 0.5) / mult
end
