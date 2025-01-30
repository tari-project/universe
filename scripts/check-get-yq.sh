#!/usr/bin/env bash
#
# Check if yq is installed, if not download and install yq into /usr/local/bin
#

set -e

# https://github.com/mikefarah/yq/releases
# amd64/arm64
whatPlatform=${whatPlatform:-amd64}
# linux
whatOS=${whatOS:-linux}
whatVersion=${whatVersion:-4.44.3}

whatFile=${1:-yq}
whereFile=$(which ${whatFile} || true)
  if [ -z "${whereFile}" ]; then
    if [[ ! -x "/usr/local/bin/${whatFile}" ]]; then
      rgTemp=${rgTemp:-$(mktemp -d)}
      # https://github.com/mikefarah/yq/releases
      # wget -v "https://github.com/mikefarah/yq/releases/download/v4.44.3/yq_linux_arm64.tar.gz"
      wget -v "https://github.com/mikefarah/yq/releases/download/v${whatVersion}/yq_${whatOS}_${whatPlatform}.tar.gz"
      tar -vxz -f yq_${whatOS}_${whatPlatform}.tar.gz --directory ${rgTemp}
      cp -v ${rgTemp}/yq_${whatOS}_${whatPlatform} /usr/local/bin/yq
      # clean up
      rm -vfr ${rgTemp}
    else
      echo "${whatFile} is in local bin"
    fi
  else
    echo "${whatFile} found in path at ${whereFile}"
  fi
