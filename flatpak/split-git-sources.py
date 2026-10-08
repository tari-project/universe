#!/usr/bin/env python3
"""Vendor git crates apart from crates.io ones in cargo-sources.json.

flatpak-cargo-generator vendors crates.io crates to cargo/vendor/<name>-<version>
and git crates to cargo/vendor/<name>, and points every source at that one
directory. When Cargo.lock holds the same crate and version from both (the tari
crates come from the tari git tag and, through the minotari wallet crate, from
crates.io), cargo finds two packages with one id in that directory, takes the git
copy, and refuses it for having no checksum.

This moves the git crates to cargo/vendor-git and points the git sources at it,
so each copy is only seen by its own source.
"""

import json
import re
import sys

VENDOR = "cargo/vendor"
VENDOR_GIT = "cargo/vendor-git"
COPY_RE = re.compile(r'^(cp -r --reflink=auto "flatpak-cargo/git/[^"]+" )"cargo/vendor/([^"/]+)"$')


def main(path: str) -> None:
    with open(path) as f:
        sources = json.load(f)

    # The generator copies each git crate out of its checkout with one cp command.
    git_crates = set()
    for source in sources:
        if source.get("type") != "shell":
            continue
        commands = []
        for command in source["commands"]:
            match = COPY_RE.match(command)
            if match:
                git_crates.add(match.group(2))
                command = f'{match.group(1)}"{VENDOR_GIT}/{match.group(2)}"'
            commands.append(command)
        source["commands"] = commands
    if not git_crates:
        sys.exit("no git crates found; has flatpak-cargo-generator's output changed?")

    config = None
    for source in sources:
        dest = source.get("dest", "")
        if dest.startswith(VENDOR + "/") and dest[len(VENDOR) + 1 :] in git_crates:
            source["dest"] = f"{VENDOR_GIT}/{dest[len(VENDOR) + 1 :]}"
        if source.get("type") == "inline" and source.get("dest-filename") == "config" and dest == "cargo":
            config = source
    if config is None:
        sys.exit("cargo config not found; has flatpak-cargo-generator's output changed?")

    # crates.io keeps vendored-sources; every git source moves to the git directory.
    contents = config["contents"]
    git_sources = len(re.findall(r'^\[source\."https?://', contents, flags=re.M))
    contents = re.sub(
        r'(^\[source\."https?://[^\]]*\]\n(?:(?!\[).*\n)*?)replace-with = "vendored-sources"',
        r'\1replace-with = "vendored-git-sources"',
        contents,
        flags=re.M,
    )
    if contents.count('replace-with = "vendored-git-sources"') != git_sources:
        sys.exit("could not repoint every git source; has the cargo config format changed?")
    contents = contents.replace(
        f'[source.vendored-sources]\ndirectory = "{VENDOR}"\n',
        f'[source.vendored-sources]\ndirectory = "{VENDOR}"\n\n'
        f'[source.vendored-git-sources]\ndirectory = "{VENDOR_GIT}"\n',
        1,
    )
    if "vendored-git-sources]" not in contents:
        sys.exit("could not add the git vendor directory; has the cargo config format changed?")
    config["contents"] = contents

    with open(path, "w") as f:
        json.dump(sources, f, indent=4)
    print(f"Vendored {len(git_crates)} git crates to {VENDOR_GIT}")


if __name__ == "__main__":
    main(sys.argv[1])
