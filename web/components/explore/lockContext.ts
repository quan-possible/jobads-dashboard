"use client";

import { createContext, useContext } from "react";

// Lets anything rendered inside an unlocked AuthGate (the chart builder, the
// posting lookup) signal that the session expired mid-use, so the gate flips
// back to the password card. Default is a no-op for use outside a gate.
export const ExploreLockContext = createContext<() => void>(() => {});

export const useExploreLock = (): (() => void) => useContext(ExploreLockContext);
