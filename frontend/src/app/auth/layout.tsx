"use client"

import * as React from "react"
import { ModeToggle } from "@/components/theme-toggle"

export default function LoginLayout({
    children,
} : {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-background text-foreground">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>

            {children}
        </div>
    )
}