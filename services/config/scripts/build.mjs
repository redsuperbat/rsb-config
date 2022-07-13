#!/usr/bin/env zx

import { $ } from "zx";

const { stdout: sha } = await $`git rev-parse --short HEAD`;

await $`docker build . -t rsb/config:${sha.trim()}`;
