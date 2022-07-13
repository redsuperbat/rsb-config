#!/usr/bin/env zx

import { $ } from "zx";

const { stdout: sha } = await $`git rev-parse --short HEAD`;

await $`docker build . -t maxrsb/rsb-config:${sha.trim()},maxrsb/rsb-config:latest`;

await $`docker push`;
