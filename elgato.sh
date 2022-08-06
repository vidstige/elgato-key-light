#/bin/bash
# searches for an elgato key light and updates the config file if found

ITEMS=$(avahi-browse -atrp | grep _elg._tcp)

IP=$(echo "$ITEMS" | cut -d';' -f 8 | sed '/^$/d' | uniq)
PORT=$(echo "$ITEMS" | cut -d';' -f 9 | sed '/^$/d' | uniq)

if [[ -z "$IP" || -z "$PORT" ]]; then
    echo "elgato not found"
    exit -1
fi

# update configfile
config_file=~/.config/elgato-key-light/config.json
test -f $config_file || echo -n "{}" > $config_file
tmp=$(mktemp)
jq . ~/.config/elgato-key-light/config.json 
jq '.url = "http://$IP:$PORT"' $tmp
mv $tmp $config_file

