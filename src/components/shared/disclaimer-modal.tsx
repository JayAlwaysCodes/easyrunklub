"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useAuthModal } from "@/components/shared/auth-modal-context";

export function DisclaimerModal() {
  const { proceedToRegister, close } = useAuthModal();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Before You Join Us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Running is powerful — but it&apos;s also physical activity, and we
          want you out there safely.
        </p>
        <p>
          By signing up, you&apos;re confirming that you&apos;re in good
          health and physically able to take part in Easy Run Klub&apos;s
          runs and activities. If you have any medical conditions or
          concerns, we&apos;d encourage you to check in with a doctor before
          joining us on the road.
        </p>
        <p>
          Easy Run Klub is here to support and motivate you every step of
          the way — but we&apos;re not able to take responsibility for
          injuries or health issues that arise from participating. Every run
          is at your own pace, and your own risk.
        </p>
        <p className="font-medium text-foreground">
          We can&apos;t wait to run with you. Let&apos;s go there — safely.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={proceedToRegister}
          className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
        >
          I Understand, Continue
        </Button>
        <Button variant="ghost" onClick={close} className="w-full">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}