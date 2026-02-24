lib.locale()

Config = Config or {}
-- Fallback only; jg-dealerships config export is merged in framework.lua.
Config.Framework = Config.Framework or 'auto'
Config.FinancePaymentInterval = Config.FinancePaymentInterval or 3
-- App metadata consumed by all phone bridges.
-- Runtime finance/framework values are merged from jg-dealerships in framework.lua.
Config.AppIdentifier = 'gs-app-finance-jg'
Config.AppName = 'Giga Cred'
Config.AppDescription = locale('app_description')
Config.AppDeveloper = 'Giga Scripts'
