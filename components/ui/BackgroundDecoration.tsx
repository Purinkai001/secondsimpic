"use client";

import React from "react";

export function BackgroundDecoration() {
    return (
        <>
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />
        </>
    );
}
