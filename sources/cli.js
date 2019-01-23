#!/usr/bin/env node

/* @flow */

import { always } from "ramda";
import { setup } from "./index";

setup({ process }).fork(console.error, always(null)); // eslint-disable-line no-console, no-undef
