-- Returns financed vehicles currently owned by the player.
-- Called by NUI through lib.callback from client.lua.
lib.callback.register('fetchfinancedvehicles', function(source)
    local identifier = Framework.Server.GetPlayerIdentifier(source)
    if not identifier then
        print('Error: could not get player identifier')
        return nil
    end

    local success, result = pcall(function()
        return MySQL.query.await("SELECT finance_data, plate FROM " .. Framework.VehiclesTable .. " WHERE " .. Framework.PlayerIdentifier .. " = ? AND financed = 1", {identifier})
    end)

    if not success then
        print(('Error fetching financed vehicles: %s'):format(tostring(result)))
        return nil
    end

    return result or {}
end)

-- Processes either an installment payment ("payment") or full payoff ("full").
-- The client does a basic sanity check first; this callback is the authoritative state update.
lib.callback.register('MakePayment', function(source, amount, paymenttype, vehicleData)
    local balance = Framework.Server.GetPlayerBalance(source, "bank")
    if amount > balance then
        print('Insufficient funds')
        return false
    end

    local newdata = vehicleData
    local finance_data = json.decode(newdata.finance_data)
    local dealershipID = finance_data.dealership_id

    if not finance_data or not dealershipID then
        print('Invalid finance or dealership data')
        return false
    end

    local dealership = MySQL.single.await("SELECT id, type FROM dealership_locations WHERE id = ?", {dealershipID})

    local identifier = Framework.Server.GetPlayerIdentifier(source)
    local plate = vehicleData.plate

    if paymenttype == "payment" then
        -- Installment flow: update finance_data, clear failure flags and pay dealership balance.
        finance_data.paid = finance_data.paid + amount
        finance_data.seconds_to_next_payment = Config.FinancePaymentInterval * 3600
        finance_data.seconds_to_repo = 0
        finance_data.payment_failed = false
        finance_data.payments_complete = finance_data.payments_complete + 1
        newdata.finance_data = json.encode(finance_data)

        local success, err = pcall(function()
            Framework.Server.PlayerRemoveMoney(source, amount, "bank")
            if dealership and dealership.type == "owned" then
                MySQL.update.await("UPDATE dealership_locations SET balance = balance + ? WHERE id = ?", {amount, dealershipID})
            end

            if finance_data.payments_complete >= finance_data.total_payments then
                -- Loan finished: clear finance_data and mark financed = 0.
                MySQL.update.await("UPDATE "..Framework.VehiclesTable.." SET finance_data = NULL, financed = 0 WHERE "..Framework.PlayerIdentifier.." = ? AND plate = ?", {identifier, plate})
                MySQL.update.await("UPDATE dealership_sales SET paid = paid + ?, owed = owed - ? WHERE plate = ? AND dealership = ?", {amount, amount, plate, dealershipID})
            else
                MySQL.update.await("UPDATE "..Framework.VehiclesTable.." SET finance_data = ? WHERE "..Framework.PlayerIdentifier.." = ? AND plate = ?", {newdata.finance_data, identifier, plate})
                MySQL.update.await("UPDATE dealership_sales SET paid = paid + ?, owed = owed - ? WHERE plate = ? AND dealership = ?", {amount, amount, plate, dealershipID})
            end
        end)

        if not success then
            print(('Error processing payment: %s'):format(tostring(err)))
            return false
        end
        return true
    else
        -- Full payoff flow: clear loan in one transaction-like callback block.
        local success, err = pcall(function()
            Framework.Server.PlayerRemoveMoney(source, amount, "bank")
            if dealership and dealership.type == "owned" then
                MySQL.update.await("UPDATE dealership_locations SET balance = balance + ? WHERE id = ?", {amount, dealershipID})
            end

            MySQL.update.await("UPDATE "..Framework.VehiclesTable.." SET finance_data = NULL, financed = 0 WHERE "..Framework.PlayerIdentifier.." = ? AND plate = ?", {identifier, plate})
            MySQL.update.await("UPDATE dealership_sales SET paid = paid + ?, owed = 0 WHERE plate = ? AND dealership = ?", {amount, plate, dealershipID})
        end)

        if not success then
            print(('Error processing full payoff: %s'):format(tostring(err)))
            return false
        end
        return true
    end
end)
