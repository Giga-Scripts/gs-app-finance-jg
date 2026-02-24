fx_version "cerulean"
game "gta5"
lua54 'yes'

title "Giga Cred"
description "Vehicle finance management app."
author "Giga Scripts"

client_scripts { "client.lua" }
server_scripts { "@oxmysql/lib/MySQL.lua", "server.lua" }
shared_scripts { '@ox_lib/init.lua', "config.lua", "framework.lua", "bridge/imports.lua" }

files {
    "ui/dist/**/*",
    "ui/icon.png",
    "config.lua",
    "locales/*.json",
    "bridge/**/imports/client.lua",
    "bridge/**/client.lua",
    "bridge/options/*",
    "bridge/*.lua",
}

dependencies {
    "jg-dealerships",
}
