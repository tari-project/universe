#!/usr/bin/env bash
#
# Must be run from the repo root
#

set -e

diffparms=${diffparms:-"-u --suppress-blank-empty --strip-trailing-cr --color=never"}
rgTemp=${rgTemp:-$(mktemp)}

# Exclude files without extensions as well as those with extensions that are not in the list
#
rg -i "Copyright.*The Tari Project" --files-without-match \
    -g '!*.{Dockerfile,asc,bat,config,config.js,css,csv,drawio,env,gitkeep,hbs,html,ini,iss,json,lock,md,min.js,ps1,py,rc,scss,sh,sql,svg,toml,txt,yml,vue,ts,tsx}' . \
    | while IFS= read -r file; do
        if [[ -n $(basename "$file" | grep -E '\.') ]]; then
            echo "$file"
        fi
    done | sort > ${rgTemp}

# Sort the .license.ignore file as sorting seems to behave differently on different platforms
licenseIgnoreTemp=${licenseIgnoreTemp:-$(mktemp)}
cat .license.ignore | sort > ${licenseIgnoreTemp}

DIFFS=$( diff ${diffparms} ${licenseIgnoreTemp} ${rgTemp} || true )

# clean up
rm -vf ${rgTemp}
rm -vf ${licenseIgnoreTemp}

if [ -n "${DIFFS}" ]; then
    echo "New files detected that either need copyright/license identifiers added, "
    echo "or they need to be added to .license.ignore"
    echo "NB: The ignore file must be sorted alphabetically!"

    echo "Diff:"
    echo "${DIFFS}"
    exit 1
fi
