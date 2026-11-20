"use client";

import { useState } from "react";

import { LoginForm } from "@/app/login/login-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/**
 * The header's "Log in" button: opens the email-code login in a popup instead of leaving the page. A successful
 * login navigates to the dashboard, which unmounts this. `/login` still exists for redirects from protected pages.
 */
export function LoginDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Log in</DialogTrigger>
      <DialogContent className="p-6 sm:max-w-md sm:p-10">
        <LoginForm embedded />
      </DialogContent>
    </Dialog>
  );
}
