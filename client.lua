local integration = require 'bridge.integration'

local vehicles = {}

local qboxVehicles = nil

-- Cache Qbox vehicle labels once per session to avoid repeated export calls.
local function getQboxVehicles()
    if qboxVehicles ~= nil then
        return qboxVehicles
    end

    if Config.Framework ~= "Qbox" or GetResourceState("qbx_core") ~= "started" then
        qboxVehicles = false
        return nil
    end

    local ok, vehiclesData = pcall(function()
        return exports.qbx_core:GetVehiclesByName()
    end)

    if not ok or type(vehiclesData) ~= "table" then
        qboxVehicles = false
        return nil
    end

    qboxVehicles = vehiclesData
    return qboxVehicles
end

-- Returns a friendly vehicle label when available (brand + model), otherwise nil.
local function getVehicleLabel(model)
    if type(model) ~= "string" then
        return nil
    end

    local vehiclesData = getQboxVehicles()
    if not vehiclesData then
        return nil
    end

    local vehicleData = vehiclesData[model]
    if type(vehicleData) ~= "table" then
        return nil
    end

    local name = type(vehicleData.name) == "string" and vehicleData.name or nil
    local brand = type(vehicleData.brand) == "string" and vehicleData.brand or ""
    if not name or name == "" then
        return nil
    end

    if brand ~= "" then
        return (brand .. " " .. name)
    end

    return name
end

-- Adds vehicle_label for UI cards using Qbox labels when available.
local function formatFinancedVehicles(fetchedVehicles)
    local formattedVehicles = fetchedVehicles or {}

    for i = 1, #formattedVehicles do
        local vehicle = formattedVehicles[i]
        local financeData = vehicle.finance_data and json.decode(vehicle.finance_data)

        local model = financeData and financeData.vehicle or nil
        vehicle.vehicle_label = getVehicleLabel(model) or model or locale('vehicle_label_fallback')
    end

    return formattedVehicles
end

-- Build localized UI strings once per response so React can stay presentation-only.
local function buildUiStrings()
    return {
        loadFailed             = locale('ui_load_failed'),
        paymentFailed          = locale('ui_payment_failed'),
        paymentProcessFailed   = locale('ui_payment_process_failed'),
        installmentPaid        = locale('ui_installment_paid'),
        vehiclePaidOff         = locale('ui_vehicle_paid_off'),

        confirmPayment         = locale('ui_confirm_payment'),
        payInstallment         = locale('ui_pay_installment'),
        settleFullBalance      = locale('ui_settle_full_balance'),
        confirmPayInstallment  = locale('ui_confirm_pay_installment'),
        confirmSettle          = locale('ui_confirm_settle'),
        cancel                 = locale('ui_cancel'),

        portfolioLabel         = locale('ui_portfolio_label'),
        overview               = locale('ui_overview'),
        fleetSize              = locale('ui_fleet_size'),
        nextCycleTotal         = locale('ui_next_cycle_total'),
        upcoming               = locale('ui_upcoming'),
        totalDebt              = locale('ui_total_debt'),
        equityPaid             = locale('ui_equity_paid'),
        collection             = locale('ui_collection'),
        noActiveFinances       = locale('ui_no_active_finances'),
        noFinancesHint         = locale('ui_no_finances_hint'),
        overdue                = locale('ui_overdue'),
        left                   = locale('ui_left'),

        remaining              = locale('ui_remaining'),
        totalFinanced          = locale('ui_total_financed'),
        perInstallment         = locale('ui_per_installment'),
        paidSoFar              = locale('ui_paid_so_far'),
        installments           = locale('ui_installments'),
        nextPayment            = locale('ui_next_payment'),
        dueIn                  = locale('ui_due_in'),
        overdueWarning         = locale('ui_overdue_warning'),
        payCycle               = locale('ui_pay_cycle'),
        settle                 = locale('ui_settle'),
        now                    = locale('ui_now'),
        numberLocale           = locale('ui_number_locale'),
    }
end

RegisterNUICallback("Fetching", function(data, cb)
    -- Request payload: { action = "fetching" }
    -- Success response: { vehicles = RawFinanceRow[], uiStrings = UiStrings }
    -- Failure response: false
    if data.action == "fetching" then
        lib.callback("fetchfinancedvehicles", false, function(fetchedVehicles)
            vehicles = formatFinancedVehicles(fetchedVehicles)
            cb({ vehicles = vehicles, uiStrings = buildUiStrings() })
        end)
    else
        cb(false)
    end
end)

RegisterNUICallback("Payment", function(data, cb)
    -- Request payload:
    -- {
    --   action = "payment",
    --   index = number,
    --   type = "payment" | "full",
    --   amount = number,
    --   data = { vehicle = string }
    -- }
    -- Success response: { vehicles = RawFinanceRow[], uiStrings = UiStrings }
    -- Failure response: false
    if data.action ~= "payment" then
        return cb(false)
    end

    local index = data.index
    local amount = data.amount
    local type = data.type
    local uiData = data.data
    local vehicle = vehicles[index + 1]

    if not vehicle then
        return cb(false)
    end

    local vehicleData = json.decode(vehicle.finance_data)
    local vehiclepay = type == "payment" and vehicleData.recurring_payment or (vehicleData.total - vehicleData.paid)

    -- Basic client-side integrity check before server callback; server still validates payment rules.
    if uiData.vehicle and (vehicleData.vehicle ~= uiData.vehicle or amount ~= vehiclepay) then
        return cb(false)
    end

    lib.callback("MakePayment", false, function(success)
        if not success then
            integration.sendNotification(locale('payment_failed'))
            return cb(false)
        end
        integration.sendNotification(
            type == "payment"
                and locale('payment_success', amount)
                or locale('payoff_success')
        )
        lib.callback("fetchfinancedvehicles", false, function(refreshed)
            vehicles = formatFinancedVehicles(refreshed)
            cb({ vehicles = vehicles, uiStrings = buildUiStrings() })
        end)
    end, amount, type, vehicle)
end)
